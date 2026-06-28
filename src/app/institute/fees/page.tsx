'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/client'
import { fmt, statusBadge } from '@/lib/portal-mock-data'
import { useToast } from '@/components/Toast'

interface Student {
  id: string
  name: string
}

interface Invoice {
  id: string
  student_id: string
  status: 'ISSUED' | 'PAID'
  due_date: string
  total_amount: number
  items_json: string
  created_at: string
  student: { user: { name: string } }
  amount_paid: number
  amount_due: number
}

export default function InstituteFeesPage() {
  const { toast } = useToast()
  const [students, setStudents] = useState<Student[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [pageIndex, setPageIndex] = useState(0)

  // Direct Payment Form State
  const [rp, setRp] = useState({ sid: '', amount: '', note: '' })
  const [recording, setRecording] = useState(false)

  // New Invoice Form State
  const [invoiceModal, setInvoiceModal] = useState(false)
  const [newInv, setNewInv] = useState({ sid: '', amount: '', description: 'Tuition Fee', dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) })
  const [issuing, setIssuing] = useState(false)

  const itemsPerPage = 8

  const loadData = () => {
    setLoading(true)
    Promise.all([
      api('/api/students?perPage=1000'),
      api('/api/invoices'),
    ])
      .then(([studentsData, invoicesData]) => {
        const studentsList = studentsData.items || []
        setStudents(studentsList)
        setInvoices(invoicesData)
        if (studentsList.length > 0) {
          setRp(prev => ({ ...prev, sid: studentsList[0].id }))
          setNewInv(prev => ({ ...prev, sid: studentsList[0].id }))
        }
      })
      .catch(err => toast(err.message, 'err'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  // Calculations
  const col = invoices.filter(i => i.status === 'PAID').reduce((a, i) => a + i.total_amount, 0)
  const pen = invoices.filter(i => i.status === 'ISSUED').reduce((a, i) => a + i.total_amount, 0)
  const cr = col + pen > 0 ? Math.round(col / (col + pen) * 100) : 0

  const filtered = invoices.filter(i => {
    const sName = i.student?.user?.name || ''
    return sName.toLowerCase().includes(search.toLowerCase())
  })

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1
  const page = Math.min(pageIndex, totalPages - 1)
  const pagedInvoices = filtered.slice(page * itemsPerPage, (page + 1) * itemsPerPage)

  const recordDirectPayment = async () => {
    const amt = Number(rp.amount)
    if (!amt || amt <= 0) { toast('Enter a valid amount', 'err'); return }
    if (!rp.sid) { toast('Select a student', 'err'); return }

    setRecording(true)
    try {
      await api('/api/fees', {
        method: 'POST',
        body: JSON.stringify({
          studentId: rp.sid,
          amount: amt,
          note: rp.note || undefined,
          markPaid: true,
        })
      })
      toast('Payment recorded successfully')
      setRp(prev => ({ ...prev, amount: '', note: '' }))
      loadData()
    } catch (err: any) {
      toast(err.message, 'err')
    } finally {
      setRecording(false)
    }
  }

  const payInvoice = async (invoiceId: string) => {
    if (!confirm('Mark this invoice as PAID?')) return
    try {
      await api(`/api/invoices/${invoiceId}/pay`, {
        method: 'POST',
        body: JSON.stringify({ method: 'CASH', note: 'Recorded via Admin/Teacher panel' })
      })
      toast('Invoice marked as PAID')
      loadData()
    } catch (err: any) {
      toast(err.message, 'err')
    }
  }

  const issueInvoice = async () => {
    const amt = Number(newInv.amount)
    if (!amt || amt <= 0) { toast('Enter a valid amount', 'err'); return }
    if (!newInv.sid) { toast('Select a student', 'err'); return }
    if (!newInv.description.trim()) { toast('Enter description', 'err'); return }

    setIssuing(true)
    try {
      await api('/api/invoices', {
        method: 'POST',
        body: JSON.stringify({
          studentId: newInv.sid,
          dueDate: newInv.dueDate,
          items: [{ description: newInv.description, amount: amt }]
        })
      })
      toast('Invoice issued successfully')
      setInvoiceModal(false)
      setNewInv(prev => ({ ...prev, amount: '' }))
      loadData()
    } catch (err: any) {
      toast(err.message, 'err')
    } finally {
      setIssuing(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
        <div className="kpi si si-1">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--t3)' }}>Collected</p>
            <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--okd)' }}><i className="fa-solid fa-indian-rupee-sign" style={{ fontSize: 11, color: 'var(--ok)' }} /></div>
          </div>
          <p className="font-display" style={{ fontWeight: 700, fontSize: 24, margin: 0 }}>Rs {fmt(col)}</p>
        </div>
        <div className="kpi si si-2">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--t3)' }}>Pending</p>
            <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--errd)' }}><i className="fa-solid fa-clock" style={{ fontSize: 11, color: 'var(--err)' }} /></div>
          </div>
          <p className="font-display" style={{ fontWeight: 700, fontSize: 24, margin: 0 }}>Rs {fmt(pen)}</p>
        </div>
        <div className="kpi si si-3">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--t3)' }}>Collection Rate</p>
            <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accd)' }}><i className="fa-solid fa-percent" style={{ fontSize: 11, color: 'var(--acc)' }} /></div>
          </div>
          <p className="font-display" style={{ fontWeight: 700, fontSize: 24, margin: 0 }}>{cr}%</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Record payment */}
        <div className="card si si-3">
          <h3 className="font-display" style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, color: 'var(--t1)' }}>Record Cash Payment (Direct)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label className="fl">Student</label>
              <select className="fi" value={rp.sid} onChange={e => setRp(p => ({ ...p, sid: e.target.value }))}>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                {students.length === 0 && <option value="">No students</option>}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="fl">Amount (Rs)</label>
                <input className="fi" type="number" placeholder="Amount" value={rp.amount} onChange={e => setRp(p => ({ ...p, amount: e.target.value }))} />
              </div>
              <div>
                <label className="fl">Note</label>
                <input className="fi" placeholder="Optional note" value={rp.note} onChange={e => setRp(p => ({ ...p, note: e.target.value }))} />
              </div>
            </div>
            <button className="btn btn-primary btn-sm" disabled={recording || loading || !rp.sid} onClick={recordDirectPayment}>
              {recording ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </div>

        {/* Issue Invoice Promo / Quick Actions */}
        <div className="card si si-4" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accd)' }}>
            <i className="fa-solid fa-file-invoice" style={{ fontSize: 20, color: 'var(--acc)' }} />
          </div>
          <div>
            <h4 className="font-display" style={{ fontWeight: 600, fontSize: 15, color: 'var(--t1)', margin: 0 }}>Issue Student Invoice</h4>
            <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 4, maxWidth: 280 }}>Create itemized fees invoices for students, send notifications, and track payment status.</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setInvoiceModal(true)}>
            <i className="fa-solid fa-plus mr-1" />Issue New Invoice
          </button>
        </div>
      </div>

      <div className="card si si-4" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--bdr)' }}>
          <div className="sb">
            <i className="fa-solid fa-magnifying-glass" style={{ fontSize: 11, color: 'var(--t3)' }} />
            <input placeholder="Search student name..." value={search} onChange={e => { setSearch(e.target.value); setPageIndex(0) }} />
          </div>
        </div>
        
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--t3)' }}>Loading invoices...</div>
        ) : (
          <table className="dt">
            <thead>
              <tr>
                <th>Student</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedInvoices.map(inv => {
                return (
                  <tr key={inv.id}>
                    <td style={{ color: 'var(--t1)', fontWeight: 500 }}>{inv.student?.user?.name || 'Unknown student'}</td>
                    <td style={{ color: 'var(--t1)' }}>
                      {inv.amount_due === 0 ? (
                        <span style={{ fontWeight: 600, color: 'var(--ok)' }}>Rs {fmt(inv.total_amount)} Paid</span>
                      ) : (
                        <>
                          <span style={{ fontWeight: 600, color: 'var(--err)' }}>Rs {fmt(inv.amount_due)} Due</span>
                          <div style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 400 }}>of Rs {fmt(inv.total_amount)}</div>
                        </>
                      )}
                    </td>
                    <td style={{ fontSize: 12 }}>{new Date(inv.due_date).toLocaleDateString()}</td>
                    <td>
                      <span className={'badge ' + (inv.amount_due === 0 ? 'b-ok' : 'b-err')}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', marginRight: 4 }} />
                        {inv.amount_due === 0 ? 'Paid' : 'Due'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {inv.amount_due > 0 ? (
                        <button className="btn btn-primary btn-sm" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => payInvoice(inv.id)}>
                          <i className="fa-solid fa-check mr-1" />Mark Paid
                        </button>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--ok)' }}><i className="fa-solid fa-circle-check mr-1" />Paid</span>
                      )}
                    </td>
                  </tr>
                )
              })}
              {pagedInvoices.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--t3)', padding: 32 }}>No invoices found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="si si-5" style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 16 }}>
        {Array.from({ length: totalPages }, (_, i) => (
          <button key={i} className={'btn btn-sm ' + (i === page ? 'btn-primary' : 'btn-ghost')} style={{ minWidth: 32 }} onClick={() => setPageIndex(i)}>{i + 1}</button>
        ))}
      </div>

      {/* Issue Invoice Modal */}
      <div className={'mo' + (invoiceModal ? ' open' : '')}>
        <div className="mo-bd" onClick={() => setInvoiceModal(false)} />
        <div className="mo-box">
          <h3 className="font-display" style={{ fontWeight: 600, fontSize: 18, marginBottom: 20, color: 'var(--t1)' }}>Issue New Invoice</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="fl">Student</label>
              <select className="fi" value={newInv.sid} onChange={e => setNewInv(p => ({ ...p, sid: e.target.value }))}>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="fl">Fee Description</label>
              <input className="fi" placeholder="e.g. Monthly Tuition Fees" value={newInv.description} onChange={e => setNewInv(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="fl">Amount (Rs)</label>
                <input className="fi" type="number" placeholder="45000" value={newInv.amount} onChange={e => setNewInv(p => ({ ...p, amount: e.target.value }))} />
              </div>
              <div>
                <label className="fl">Due Date</label>
                <input className="fi" type="date" value={newInv.dueDate} onChange={e => setNewInv(p => ({ ...p, dueDate: e.target.value }))} />
              </div>
            </div>
            <button className="btn btn-primary w-full" disabled={issuing} onClick={issueInvoice}>
              {issuing ? 'Issuing Invoice...' : 'Issue Invoice'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


