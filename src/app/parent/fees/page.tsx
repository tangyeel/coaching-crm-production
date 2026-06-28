'use client'

import { useState, useEffect } from 'react'
import { getInitials, fmt, fmtC, statusBadge } from '@/lib/portal-mock-data'
import { api } from '@/lib/client'
import { useToast } from '@/components/Toast'

export default function ParentFeesPage() {
  const { toast } = useToast()
  const [data, setData] = useState<any>(null)
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [payModal, setPayModal] = useState<{ id: string; invoiceNumber: string; amount: number } | null>(null)
  const [busy, setBusy] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi')
  const [upiId, setUpiId] = useState('success@razorpay')
  const [selectedBank, setSelectedBank] = useState('HDFC Bank')

  const load = () => {
    setLoading(true)
    Promise.all([
      api('/api/student/dashboard'),
      api('/api/invoices')
    ])
      .then(([dashboardData, invoicesList]) => {
        setData(dashboardData)
        setInvoices(invoicesList)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load parent fees:', err)
        setLoading(false)
      })
  }

  useEffect(() => {
    load()
  }, [])

  const pay = async (id: string) => {
    setBusy(true)
    try {
      await api(`/api/invoices/${id}/pay`, {
        method: 'POST',
        body: JSON.stringify({ method: 'ONLINE' })
      })
      toast('Payment successful!')
      setPayModal(null)
      load()
    } catch (err: any) {
      toast(err.message, 'err')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--t3)' }}>Loading fees information...</div>
  }

  if (!data) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--err)' }}>Failed to load fees data.</div>
  }

  const ch = data.student
  const av = getInitials(ch.name, 0)

  return (
    <div>
      <div className="card si si-1">
        {/* Ward header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, borderRadius: 10, marginBottom: 20, background: 'var(--bg2)', border: '1px solid var(--bdr)' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, background: av.bg, color: av.color }}>{av.initials}</div>
          <div>
            <p className="font-display" style={{ fontWeight: 600, margin: 0, color: 'var(--t1)' }}>{ch.name}</p>
            <p style={{ fontSize: 12, margin: 0, color: 'var(--t3)' }}>{ch.email} — Status: {ch.is_active ? 'Active' : 'Inactive'}</p>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <p style={{ fontSize: 12, color: 'var(--t3)', margin: 0 }}>Guardian</p>
            <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--t1)', margin: 0 }}>{ch.guardian_name || 'Not Specified'}</p>
          </div>
        </div>

        {/* Header row */}
        <div className="ir" style={{ borderBottom: '1px solid var(--bdr)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--t3)' }}>
          <span>Invoice ID</span><span>Amount</span><span>Due Date</span><span>Status</span><span>Action</span>
        </div>

        {invoices.map((inv: any, idx: number) => {
          const statusLower = inv.status.toLowerCase()
          const sb = statusBadge(statusLower)
          const invNum = `INV-${inv.id.substring(0, 8).toUpperCase()}`
          return (
            <div key={inv.id || idx} className="ir">
              <span style={{ color: 'var(--t1)', fontWeight: 500 }}>
                <i className="fa-solid fa-file-lines" style={{ color: 'var(--t3)', marginRight: 8 }} />{invNum}
              </span>
              <span style={{ fontWeight: 600, color: 'var(--t1)' }}>{fmtC(inv.total_amount)}</span>
              <span style={{ color: 'var(--t2)' }}>{new Date(inv.due_date).toLocaleDateString()}</span>
              <span><span className={'badge ' + sb.cls}><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />{sb.label}</span></span>
              <span>
                {inv.status !== 'PAID'
                  ? <button className="btn btn-primary btn-sm" onClick={() => setPayModal({ id: inv.id, invoiceNumber: invNum, amount: inv.total_amount })}><i className="fa-solid fa-credit-card" style={{ marginRight: 6 }} />Pay</button>
                  : <button className="btn btn-ghost btn-sm" onClick={() => toast('Receipt downloaded')}><i className="fa-solid fa-download" style={{ fontSize: 10, marginRight: 6 }} />Receipt</button>
                }
              </span>
            </div>
          )
        })}

        {invoices.length === 0 && (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--t3)' }}>No invoices issued yet</div>
        )}
      </div>

      {/* Pay modal */}
      <div className={'mo' + (payModal ? ' open' : '')}>
        <div className="mo-bd" onClick={() => setPayModal(null)} />
        <div className="mo-box" style={{ textAlign: 'center', maxWidth: 420 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', background: 'rgba(51, 153, 204, 0.1)' }}>
            <i className="fa-solid fa-wallet" style={{ fontSize: 22, color: '#3399cc' }} />
          </div>
          <h3 className="font-display" style={{ fontWeight: 700, fontSize: 20, marginBottom: 4, color: 'var(--t1)' }}>Razorpay Checkout</h3>
          <p style={{ fontSize: 14, marginBottom: 20, color: 'var(--t2)' }}>{payModal?.invoiceNumber} — {payModal ? fmtC(payModal.amount) : ''}</p>
          
          {/* Tab Selection */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--bdr)', marginBottom: 16 }}>
            {(['upi', 'card', 'netbanking'] as const).map(tab => (
              <button
                key={tab}
                className="btn btn-sm btn-ghost"
                style={{
                  flex: 1,
                  borderRadius: 0,
                  borderBottom: paymentMethod === tab ? '2px solid #3399cc' : 'none',
                  color: paymentMethod === tab ? 'var(--t1)' : 'var(--t3)',
                  fontWeight: paymentMethod === tab ? 600 : 400,
                  textTransform: 'uppercase',
                  fontSize: 11,
                  padding: '10px 0'
                }}
                onClick={() => setPaymentMethod(tab)}
              >
                {tab === 'upi' ? 'UPI' : tab === 'card' ? 'Card' : 'Netbanking'}
              </button>
            ))}
          </div>

          <div style={{ minHeight: 140, textAlign: 'left', marginBottom: 20 }}>
            {paymentMethod === 'upi' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label className="fl">UPI ID / VPA</label>
                <input
                  className="fi"
                  placeholder="name@upi"
                  value={upiId}
                  onChange={e => setUpiId(e.target.value)}
                />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 4 }}>
                  {['Google Pay', 'PhonePe', 'Paytm'].map(app => (
                    <button
                      key={app}
                      className="btn btn-ghost"
                      style={{ fontSize: 10, padding: '6px', border: '1px solid var(--bdr)', borderRadius: 6 }}
                      onClick={() => setUpiId(`${app.toLowerCase().replace(' ', '')}@upi`)}
                    >
                      {app}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {paymentMethod === 'card' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label className="fl">Card Number</label>
                  <input className="fi" placeholder="4381 1234 5678 9012" defaultValue="4381 1234 5678 9012" readOnly />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="fl">Expiry</label>
                    <input className="fi" placeholder="MM/YY" defaultValue="12/30" readOnly />
                  </div>
                  <div>
                    <label className="fl">CVV</label>
                    <input className="fi" placeholder="123" defaultValue="123" readOnly />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'netbanking' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label className="fl">Select Bank</label>
                <select
                  className="fi"
                  value={selectedBank}
                  onChange={e => setSelectedBank(e.target.value)}
                >
                  {['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra Bank'].map(bank => (
                    <option key={bank} value={bank}>{bank}</option>
                  ))}
                </select>
                <p style={{ fontSize: 11, color: 'var(--t3)', margin: 0 }}>You will be redirected to the secure page of {selectedBank} to complete your transaction.</p>
              </div>
            )}
          </div>

          <button
            className="btn w-full"
            style={{ backgroundColor: '#3399cc', color: '#fff', fontWeight: 600 }}
            disabled={busy}
            onClick={() => payModal && pay(payModal.id)}
          >
            {busy ? 'Processing...' : `Pay ${payModal ? fmtC(payModal.amount) : ''}`}
          </button>
          <p style={{ fontSize: 10, marginTop: 12, color: 'var(--t3)' }}>Razorpay — Test Mode</p>
        </div>
      </div>
    </div>
  )
}
