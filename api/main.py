from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path
from uuid import uuid4
import json
import os
import sqlite3
import urllib.request

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from eth_account import Account
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "stableflow.db"
APP_ORIGIN = "https://app.stableflowagent.xyz"
PAYMENT_ADDRESS = os.getenv("STABLEFLOW_PAYMENT_ADDRESS", "0x96a7da081226d1712053c882f9d34855b58d794f")
NETWORK_NAME = os.getenv("STABLEFLOW_NETWORK_NAME", "Arc Testnet")
NETWORK_SLUG = os.getenv("STABLEFLOW_NETWORK_SLUG", "arc-testnet")
CHAIN_ID = os.getenv("STABLEFLOW_CHAIN_ID", "5042002")
CURRENCY = os.getenv("STABLEFLOW_CURRENCY", "USDC")
EXPLORER_URL = os.getenv("STABLEFLOW_EXPLORER_URL", "https://testnet.arcscan.app")

app = FastAPI(title="StableFlow Agent API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://app.stableflowagent.xyz", "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class InvoiceCreate(BaseModel):
    customer: str = Field(min_length=1, max_length=120)
    amount: float = Field(gt=0, le=1_000_000)
    memo: str = Field(default="", max_length=240)

class InvoiceUpdate(BaseModel):
    status: str = Field(pattern="^(unpaid|paid|expired)$")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def connect():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS invoices (
              id TEXT PRIMARY KEY,
              customer TEXT NOT NULL,
              amount REAL NOT NULL,
              memo TEXT NOT NULL DEFAULT '',
              status TEXT NOT NULL DEFAULT 'unpaid',
              payment_address TEXT NOT NULL,
              created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        """
    )
    columns = {row[1] for row in conn.execute("PRAGMA table_info(invoices)").fetchall()}
    for col, ddl in {
        "paid_tx_hash": "ALTER TABLE invoices ADD COLUMN paid_tx_hash TEXT",
        "paid_at": "ALTER TABLE invoices ADD COLUMN paid_at TEXT",
        "deposit_private_key": "ALTER TABLE invoices ADD COLUMN deposit_private_key TEXT",
    }.items():
        if col not in columns:
            conn.execute(ddl)
    conn.commit()


def create_deposit_wallet():
    account = Account.create()
    return account.address, account.key.hex()


def row_to_invoice(row):
    return {
        "id": row["id"],
        "customer": row["customer"],
        "amount": row["amount"],
        "memo": row["memo"],
        "status": row["status"],
        "payment_address": row["payment_address"],
        "payment_url": f"{APP_ORIGIN}/pay/{row['id']}",
        "network_name": NETWORK_NAME,
        "network_slug": NETWORK_SLUG,
        "chain_id": CHAIN_ID,
        "currency": CURRENCY,
        "explorer_url": EXPLORER_URL,
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
        "paid_tx_hash": row["paid_tx_hash"] if "paid_tx_hash" in row.keys() else None,
        "paid_at": row["paid_at"] if "paid_at" in row.keys() else None,
    }


def find_matching_payment(row):
    if row["status"] == "paid":
        return None
    payment_address = row["payment_address"]
    url = f"{EXPLORER_URL}/api/v2/addresses/{payment_address}/transactions"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "StableFlow-Agent/0.1"})
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except Exception:
        return None

    expected = Decimal(str(row["amount"])) * Decimal(10) ** 18
    created = row["created_at"]
    for tx in data.get("items", []):
        if tx.get("status") != "ok":
            continue
        to_hash = ((tx.get("to") or {}).get("hash") or "").lower()
        if to_hash != payment_address.lower():
            continue
        if tx.get("timestamp", "") < created:
            continue
        value = Decimal(tx.get("value") or "0")
        if value >= expected:
            return {"hash": tx.get("hash"), "timestamp": tx.get("timestamp")}
    return None


def sync_payment_status(invoice_id: str):
    row = get_invoice_row(invoice_id)
    if not row:
        return None
    match = find_matching_payment(row)
    if match:
        now = now_iso()
        with connect() as conn:
            conn.execute(
                "UPDATE invoices SET status = ?, paid_tx_hash = ?, paid_at = ?, updated_at = ? WHERE id = ?",
                ("paid", match["hash"], match["timestamp"] or now, now, invoice_id),
            )
        return get_invoice_row(invoice_id)
    return row


def get_invoice_row(invoice_id: str):
    init_db()
    with connect() as conn:
        return conn.execute("SELECT * FROM invoices WHERE id = ?", (invoice_id,)).fetchone()


@app.get("/api/health")
def health():
    return {"ok": True, "service": "stableflow-agent-api"}


@app.get("/api/invoices")
def list_invoices():
    init_db()
    with connect() as conn:
        rows = conn.execute("SELECT * FROM invoices ORDER BY created_at DESC LIMIT 50").fetchall()
    synced = [sync_payment_status(row["id"]) or row for row in rows]
    return [row_to_invoice(row) for row in synced]


@app.post("/api/invoices", status_code=201)
def create_invoice(payload: InvoiceCreate):
    init_db()
    invoice_id = uuid4().hex[:10]
    ts = now_iso()
    payment_address, deposit_private_key = create_deposit_wallet()
    with connect() as conn:
        conn.execute(
            "INSERT INTO invoices (id, customer, amount, memo, status, payment_address, deposit_private_key, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (invoice_id, payload.customer.strip(), float(payload.amount), payload.memo.strip(), "unpaid", payment_address, deposit_private_key, ts, ts),
        )
        row = conn.execute("SELECT * FROM invoices WHERE id = ?", (invoice_id,)).fetchone()
        conn.commit()
    return row_to_invoice(row)


@app.get("/api/invoices/{invoice_id}")
def get_invoice(invoice_id: str):
    init_db()
    row = sync_payment_status(invoice_id)
    if not row:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return row_to_invoice(row)


@app.patch("/api/invoices/{invoice_id}")
def update_invoice(invoice_id: str, payload: InvoiceUpdate):
    init_db()
    with connect() as conn:
        row = conn.execute("SELECT * FROM invoices WHERE id = ?", (invoice_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Invoice not found")
        conn.execute("UPDATE invoices SET status = ?, updated_at = ? WHERE id = ?", (payload.status, now_iso(), invoice_id))
        row = conn.execute("SELECT * FROM invoices WHERE id = ?", (invoice_id,)).fetchone()
        conn.commit()
    return row_to_invoice(row)
