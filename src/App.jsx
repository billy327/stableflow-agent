import { useEffect, useMemo, useState } from 'react'
import brandLogo from './assets/brand/logo-lockup-card.png'
import './App.css'

const API = '/api'

const defaultSplits = [
  { label: 'Merchant Wallet', percent: 70, address: '0xmerchant...flow' },
  { label: 'Savings Vault', percent: 20, address: '0xsavings...flow' },
  { label: 'Ops Wallet', percent: 10, address: '0xops...flow' },
]

const features = [
  ['01', 'Invoice link', 'Generate persistent USDC payment links for clients and operators.'],
  ['02', 'Live status', 'Track unpaid, paid, expired and reminder state from one console.'],
  ['03', 'Treasury rules', 'Preview merchant, savings and operations routing before funds move.'],
]

const flowSteps = [
  { num: '1', title: 'Invoice', text: 'Create a USDC payment link and send it to the customer.', icon: '$' },
  { num: '2', title: 'Reminder', text: 'Automated follow-ups keep the payment moving.', icon: '✉' },
  { num: '3', title: 'Approval', text: 'Review status, confirm details, then approve settlement.', icon: '✓' },
  { num: '4', title: 'Payment', text: 'Funds settle and route into the right wallets.', icon: '→' },
]

function money(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n || 0))
}

function App() {
  const [invoice, setInvoice] = useState({ customer: 'Nova Studio', amount: 250, memo: 'Design retainer', status: 'unpaid' })
  const [invoices, setInvoices] = useState([])
  const [activeId, setActiveId] = useState('')
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')

  const activeInvoice = useMemo(() => invoices.find((item) => item.id === activeId) || invoices[0], [invoices, activeId])
  const displayInvoice = activeInvoice || invoice
  const splitRows = defaultSplits.map((s) => ({ ...s, amount: Number(displayInvoice.amount || 0) * s.percent / 100 }))
  const totalPaid = invoices.filter((item) => item.status === 'paid').reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const totalUnpaid = invoices.filter((item) => item.status !== 'paid').reduce((sum, item) => sum + Number(item.amount || 0), 0)

  async function loadInvoices() {
    const res = await fetch(`${API}/invoices`)
    if (!res.ok) throw new Error('Failed to load invoices')
    const data = await res.json()
    setInvoices(data)
    if (data.length && !activeId) setActiveId(data[0].id)
  }

  useEffect(() => {
    loadInvoices().catch(() => setNotice('API belum siap. Coba refresh sebentar lagi.'))
  }, [])

  async function createInvoice() {
    setLoading(true)
    setNotice('')
    try {
      const res = await fetch(`${API}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer: invoice.customer, amount: Number(invoice.amount), memo: invoice.memo }),
      })
      if (!res.ok) throw new Error('Create failed')
      const created = await res.json()
      setInvoices((items) => [created, ...items])
      setActiveId(created.id)
      setNotice(`Payment link ready: ${created.payment_url}`)
    } catch (err) {
      setNotice('Gagal create invoice. API error.')
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(status) {
    if (!displayInvoice?.id) return
    const res = await fetch(`${API}/invoices/${displayInvoice.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) return setNotice('Gagal update status.')
    const updated = await res.json()
    setInvoices((items) => items.map((item) => item.id === updated.id ? updated : item))
    setNotice(`Invoice ${updated.id} marked ${updated.status}.`)
  }

  return (
    <main>
      <nav className="nav">
        <a className="nav-brand" href="#top"><img src={brandLogo} alt="Stable Flow Agent" /><span>StableFlow</span></a>
        <div className="nav-links"><a href="#workflow">Workflow</a><a href="#new">Invoice</a><a href="#dashboard">Dashboard</a></div>
      </nav>

      <section className="hero stacked" id="top">
        <div className="hero-copy">
          <div className="badge">Stablecoin payment ops · live MVP</div>
          <h1>Payment workflows that make USDC operations feel automatic.</h1>
          <p className="subcopy">Create persistent payment links, track invoice state, and preview treasury splits across merchant, savings, and ops wallets in one clean operator console.</p>
          <div className="actions">
            <a href="#new" className="button primary">Create invoice</a>
            <a href="#dashboard" className="button ghost">View dashboard</a>
          </div>
          <div className="trust-row"><span>SQLite persistence</span><span>Mock settlement</span><span>No wallet risk</span></div>
        </div>

        <section className="flow-wide" id="workflow" aria-label="Live payment flow">
          <div className="flow-header">
            <div>
              <p className="eyebrow">Live payment flow</p>
              <h2>Invoice to settlement, tracked in real time.</h2>
            </div>
            <strong>{money(totalPaid || 12480)}</strong>
          </div>
          <div className="flow-steps">
            {flowSteps.map((step, idx) => (
              <article className="flow-step" key={step.title}>
                <div className="step-num">{step.num}</div>
                <div className="step-icon">{step.icon}</div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
                {idx < flowSteps.length - 1 && <span className="connector">→</span>}
              </article>
            ))}
          </div>
          <div className="flow-progress"><span>Invoice → Reminder → Approval → Payment</span><b>On pace</b></div>
        </section>
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
          <button className="button primary full" disabled={loading} onClick={createInvoice}>{loading ? 'Creating...' : 'Generate real link'}</button>
          {notice && <p className="success">{notice}</p>}
        </div>

        <div className="panel pay-card" id="pay">
          <p className="eyebrow light">Payment page</p>
          <h2>{displayInvoice.customer}</h2>
          <p className="memo">{displayInvoice.memo}</p>
          <div className="amount">{money(displayInvoice.amount)} USDC</div>
          <div className={`status ${displayInvoice.status}`}>{displayInvoice.status}</div>
          {displayInvoice.payment_address && <p className="address">Pay to: {displayInvoice.payment_address}</p>}
          <button className="button primary full" disabled={!displayInvoice.id} onClick={() => updateStatus('paid')}>Mark as paid</button>
          <button className="button ghost dark full" disabled={!displayInvoice.id} onClick={() => updateStatus('unpaid')}>Reset unpaid</button>
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
          <div className="metric"><span>Invoices stored</span><strong>{invoices.length}</strong></div>
          <div className="metric"><span>Total paid</span><strong>{money(totalPaid)}</strong></div>
          <div className="metric"><span>Total unpaid</span><strong>{money(totalUnpaid)}</strong></div>
          <div className="invoice-list">
            {invoices.slice(0, 5).map((item) => <button key={item.id} onClick={() => setActiveId(item.id)} className={item.id === displayInvoice.id ? 'active' : ''}>{item.customer}<span>{item.status} · {money(item.amount)}</span></button>)}
          </div>
          <p className="fine">This MVP now stores invoices in SQLite through a FastAPI backend. Settlement is still mock mode until RPC monitoring is added.</p>
        </div>
      </section>
    </main>
  )
}

export default App
