'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/client'
import { motion, AnimatePresence } from 'framer-motion'
import PageTransition from '@/components/PageTransition'
import CountUp from '@/components/CountUp'
import ReceiptButton from '@/components/ReceiptButton'
import { useToast } from '@/components/Toast'

const money = (n: number) => `\u20b9${n.toLocaleString('en-IN')}`
const emptyForm = { studentId: '', amount: '', note: '', markPaid: true }

export default function FeesPage() {
  const [data, setData] = useState<any>(null)
  const [page, setPage] = useState(1)
  const [students, setStudents] = useState<any[]>([])
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { toast } = useToast()

  const load = (p = page) =>
    api(`/api/fees?page=${p}&perPage=8`).then(setData).catch((e) => setError(e.message))

  useEffect(() => { load(page) }, [page]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    api('/api/students?perPage=100').then((d) => setStudents(d.items)).catch(() => {})
  }, [])

  async function record(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api('/api/fees', {
        method: 'POST',
        body: JSON.stringify({
          studentId: form.studentId,
          amount: Number(form.amount),
          note: form.note || undefined,
          markPaid: form.markPaid,
        }),
      })
      setForm(emptyForm)
      toast('Payment recorded successfully')
      setPage(1)
      await load(1)
    } catch (err: any) { setError(err.message) }
    setBusy(false)
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.perPage)) : 1

  return (
    <PageTransition>
      <h1>Fees</h1>
      <div className="grid cols-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div className="card hoverable">
          <div className="stat">{data ? <CountUp value={data.collected} formatter={money} /> : '…'}</div>
          <div className="muted">Total collected</div>
        </div>
        <div className="card hoverable">
          <div className="stat">{data ? <CountUp value={data.total} /> : '…'}</div>
          <div className="muted">Payments logged</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 22 }}>
        <h2>💳 Record payment</h2>
        <form className="row" onSubmit={record}>
          <div>
            <label>Student</label>
            <select value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} required>
              <option value="">Select student…</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.user.name} {s.feeStatus === 'DUE' ? '· DUE' : ''}
                </option>
              ))}
            </select>
          </div>
          <div><label>Amount ({'\u20b9'})</label><input type="number" min={1} step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></div>
          <div><label>Note</label><input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="June fees, cash…" /></div>
          <div>
            <label style={{ marginBottom: 10 }}>Mark fee status paid</label>
            <input
              type="checkbox"
              checked={form.markPaid}
              onChange={(e) => setForm({ ...form, markPaid: e.target.checked })}
              style={{ width: 20, height: 20 }}
            />
          </div>
          <button className="btn" disabled={busy}>{busy ? 'Recording…' : 'Record payment'}</button>
        </form>
        {error && <p className="error">{error}</p>}
      </div>

      <div className="card">
        <h2>📒 Payment ledger</h2>
        {!data ? (
          <div className="skeleton" style={{ height: 160 }} />
        ) : data.items.length === 0 ? (
          <p className="muted">No payments logged yet.</p>
        ) : (
          <>
            <table>
              <thead><tr><th>Date</th><th>Student</th><th>Amount</th><th>Note</th><th style={{ width: 50 }}>Receipt</th></tr></thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {data.items.map((p: any, idx: number) => (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2, delay: idx * 0.04 }}
                    >
                      <td className="muted">{new Date(p.paidAt).toLocaleString()}</td>
                      <td><strong>{p.student.user.name}</strong></td>
                      <td><span className="badge green">{money(p.amount)}</span></td>
                      <td className="muted">{p.note || '-'}</td>
                      <td><ReceiptButton id={p.id} /></td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
            <div className="pager">
              <button className="btn outline sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
              <span className="muted">Page {data.page} of {totalPages} · {data.total} payments</span>
              <button className="btn outline sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next →</button>
            </div>
          </>
        )}
      </div>
    </PageTransition>
  )
}
