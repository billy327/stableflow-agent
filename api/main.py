from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4
import os
import sqlite3

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "stableflow.db"
APP_ORIGIN = "https://app.stableflowagent.xyz"
PAYMENT_ADDRESS = os.getenv("STABLEFLOW_PAYMENT_ADDRESS", "0x96a7da081226d1712053c882f9d34855b58d794f")
NETWORK_NAME = os.getenv("STABLEFLOW_NETWORK_NAME", "Arc Testnet")
NETWORK_SLUG = os.getenv("STABLEFLOW_NETWORK_SLUG", "arc-testnet")
CHAIN_ID = os.getenv("STABLEFLOW_CHAIN_ID", "")
CURRENCY = os.getenv("STABLEFLOW_CURRENCY", "USDC")

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
        conn.commit()


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
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


@app.on_event("startup")
def startup():
    init_db()


@app.get("/api/health")
def health():
    return {"ok": True, "service": "stableflow-agent-api"}


@app.get("/api/invoices")
def list_invoices():
    init_db()
    with connect() as conn:
        rows = conn.execute("SELECT * FROM invoices ORDER BY created_at DESC LIMIT 50").fetchall()
    return [row_to_invoice(row) for row in rows]


@app.post("/api/invoices", status_code=201)
def create_invoice(payload: InvoiceCreate):
    init_db()
    invoice_id = uuid4().hex[:10]
    ts = now_iso()
    # Demo address placeholder. Production should assign chain-specific deposit addresses.
    payment_address = PAYMENT_ADDRESS
    with connect() as conn:
        conn.execute(
            "INSERT INTO invoices (id, customer, amount, memo, status, payment_address, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (invoice_id, payload.customer.strip(), float(payload.amount), payload.memo.strip(), "unpaid", payment_address, ts, ts),
        )
        row = conn.execute("SELECT * FROM invoices WHERE id = ?", (invoice_id,)).fetchone()
        conn.commit()
    return row_to_invoice(row)


@app.get("/api/invoices/{invoice_id}")
def get_invoice(invoice_id: str):
    init_db()
    with connect() as conn:
        row = conn.execute("SELECT * FROM invoices WHERE id = ?", (invoice_id,)).fetchone()
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
