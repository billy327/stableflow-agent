import { useMemo, useState } from 'react'
import brandLogo from './assets/brand/logo-lockup-card.png'
import workflowLogo from './assets/brand/workflow-logo.png'
import banner from './assets/brand/banner.png'
import './App.css'

const defaultSplits = [
  { label: 'Merchant Wallet', percent: 70, address: '0xmerchant...flow' },
  { label: 'Savings Vault', percent: 20, address: '0xsavings...flow' },
  { label: 'Ops Wallet', percent: 10, address: '0xops...flow' },
]

const features = [
  ['01', 'Invoice link', 'Generate clean USDC payment links for clients and operators.'],
  ['02', 'Live status', 'Track unpaid, paid, settlement and reminder state from one console.'],
  ['03', 'Treasury rules', 'Preview merchant, savings and operations routing before funds move.'],
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
    <main>
      <nav className="nav">
        <a className="nav-brand" href="#top"><img src={brandLogo} alt="Stable Flow Agent" /><span>StableFlow</span></a>
        <div className="nav-links"><a href="#workflow">Workflow</a><a href="#new">Invoice</a><a href="#dashboard">Dashboard</a></div>
      </nav>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="badge">Stablecoin payment ops · MVP</div>
          <h1>Payment workflows that make USDC operations feel automatic.</h1>
          <p className="subcopy">Create payment links, track invoice state, and preview treasury splits across merchant, savings, and ops wallets in one clean operator console.</p>
          <div className="actions">
            <a href="#new" className="button primary">Create invoice</a>
            <a href="#dashboard" className="button ghost">View dashboard</a>
          </div>
          <div className="trust-row"><span>USDC ready</span><span>Mock settlement</span><span>No wallet risk</span></div>
        </div>

        <aside className="hero-card">
          <div className="card-topline"><span>Live payment flow</span><strong>{money(12480)}</strong></div>
          <img src={workflowLogo} alt="Automated payment workflow illustration" />
          <div className="flow-footer"><span>Invoice → Reminder → Approval → Payment</span><b>On pace</b></div>
        </aside>
      </section>

      <section className="brand-strip" id="workflow">
        <img src={banner} alt="Stable Flow Agent payment workflow banner" />
      </section>

      <section className="feature-grid">
        {features.map(([num, title, text]) => <article className="feature" key={title}><span>{num}</span><h3>{title}</h3><p>{text}</p></article>)}
      </section>

      <section id="new" className="workspace">
        <div className="panel form-panel">
          <p className="eyebrow">Invoice creator</p>
          <h2>Create payment link</h2>
          <label>Customer<input value={invoice.customer} onChange={(e) => setInvoice({ ...invoice, customer: e.target.value })} /></label>
          <label>Amount USDC<input type="number" value={invoice.amount} onChange={(e) => setInvoice({ ...invoice, amount: e.target.value })} /></label>
          <label>Memo<input value={invoice.memo} onChange={(e) => setInvoice({ ...invoice, memo: e.target.value })} /></label>
          <button className="button primary full" onClick={() => setCreated(true)}>Generate mock link</button>
          {created && <p className="success">Payment link ready: /pay/{invoiceId}</p>}
        </div>

        <div className="panel pay-card" id="pay">
          <p className="eyebrow light">Payment page</p>
          <h2>{invoice.customer}</h2>
          <p className="memo">{invoice.memo}</p>
          <div className="amount">{money(invoice.amount)} USDC</div>
          <div className={`status ${invoice.status}`}>{invoice.status}</div>
          <button className="button primary full" onClick={() => setInvoice({ ...invoice, status: 'paid' })}>Mark as paid</button>
          <button className="button ghost dark full" onClick={() => setInvoice({ ...invoice, status: 'unpaid' })}>Reset unpaid</button>
        </div>
      </section>

      <section className="dashboard" id="dashboard">
        <div className="panel">
          <p className="eyebrow">Auto-split preview</p>
          <h2>Treasury routing</h2>
          {splitRows.map((row) => <div className="split" key={row.label}><div><strong>{row.label}</strong><span>{row.address}</span></div><div>{row.percent}% · {money(row.amount)}</div></div>)}
        </div>
        <div className="panel insight">
          <p className="eyebrow">Operator dashboard</p>
          <h2>Invoice status</h2>
          <div className="metric"><span>Current invoice</span><strong>{invoice.status === 'paid' ? 'Paid' : 'Unpaid'}</strong></div>
          <div className="metric"><span>Expected settlement</span><strong>{money(invoice.amount)}</strong></div>
          <div className="metric"><span>Risk note</span><strong>Mock mode</strong></div>
          <p className="fine">Production can add wallet auth, USDC settlement, payment webhooks, accounting exports, and automated reminders.</p>
        </div>
      </section>
    </main>
  )
}

export default App
