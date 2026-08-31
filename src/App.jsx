import { useMemo, useState } from 'react'
import './App.css'

const defaultSplits = [
  { label: 'Merchant Wallet', percent: 70, address: '0xmerchant...flow' },
  { label: 'Savings Vault', percent: 20, address: '0xsavings...flow' },
  { label: 'Ops Wallet', percent: 10, address: '0xops...flow' },
]

function money(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n || 0))
}

function App() {
  const [invoice, setInvoice] = useState({ customer: 'Nova Studio', amount: 250, memo: 'Design retainer', status: 'unpaid' })
  const [created, setCreated] = useState(false)

  const invoiceId = useMemo(() => {
    const base = `${invoice.customer}-${invoice.amount}-${invoice.memo}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    return base || 'stableflow-invoice'
  }, [invoice])

  const splitRows = defaultSplits.map((s) => ({ ...s, amount: Number(invoice.amount || 0) * s.percent / 100 }))

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">StableFlow Agent MVP</p>
          <h1>Payment links and treasury splits for stablecoin-native operators.</h1>
          <p className="subcopy">Create a USDC invoice, share a payment link, track paid/unpaid state, and preview how funds split across merchant, savings, and ops wallets.</p>
          <div className="actions">
            <a href="#new" className="button primary">Create invoice</a>
            <a href="#dashboard" className="button ghost">View dashboard</a>
          </div>
        </div>
        <div className="card balance-card">
          <span>Projected month</span>
          <strong>{money(12480)}</strong>
          <p>AI summary: revenue is stable, ops spend is under target, and savings allocation is on pace.</p>
        </div>
      </section>

      <section id="new" className="grid two">
        <div className="card">
          <p className="eyebrow">Invoice creator</p>
          <h2>Create payment link</h2>
          <label>Customer<input value={invoice.customer} onChange={(e) => setInvoice({ ...invoice, customer: e.target.value })} /></label>
          <label>Amount USDC<input type="number" value={invoice.amount} onChange={(e) => setInvoice({ ...invoice, amount: e.target.value })} /></label>
          <label>Memo<input value={invoice.memo} onChange={(e) => setInvoice({ ...invoice, memo: e.target.value })} /></label>
          <button className="button primary full" onClick={() => setCreated(true)}>Generate mock link</button>
          {created && <p className="success">Payment link ready: /pay/{invoiceId}</p>}
        </div>

        <div className="card pay-card" id="pay">
          <p className="eyebrow">Payment page</p>
          <h2>{invoice.customer}</h2>
          <p className="memo">{invoice.memo}</p>
          <div className="amount">{money(invoice.amount)} USDC</div>
          <div className={`status ${invoice.status}`}>{invoice.status}</div>
          <button className="button primary full" onClick={() => setInvoice({ ...invoice, status: 'paid' })}>Mark as paid</button>
          <button className="button ghost full" onClick={() => setInvoice({ ...invoice, status: 'unpaid' })}>Reset unpaid</button>
        </div>
      </section>

      <section className="grid two" id="dashboard">
        <div className="card">
          <p className="eyebrow">Auto-split preview</p>
          <h2>Treasury routing</h2>
          {splitRows.map((row) => (
            <div className="split" key={row.label}>
              <div><strong>{row.label}</strong><span>{row.address}</span></div>
              <div>{row.percent}% · {money(row.amount)}</div>
            </div>
          ))}
        </div>
        <div className="card">
          <p className="eyebrow">Operator dashboard</p>
          <h2>Invoice status</h2>
          <div className="metric"><span>Current invoice</span><strong>{invoice.status === 'paid' ? 'Paid' : 'Unpaid'}</strong></div>
          <div className="metric"><span>Expected settlement</span><strong>{money(invoice.amount)}</strong></div>
          <div className="metric"><span>Risk note</span><strong>Mock mode</strong></div>
          <p className="fine">This MVP uses simulated state only. Production integrations can add wallet auth, USDC settlement, webhooks, and accounting exports.</p>
        </div>
      </section>
    </main>
  )
}

export default App
