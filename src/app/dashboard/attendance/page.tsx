'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/client'
import { motion, AnimatePresence } from 'framer-motion'
import PageTransition from '@/components/PageTransition'
import { useToast } from '@/components/Toast'

const today = () => new Date().toISOString().slice(0, 10)
const STATUSES = ['PRESENT', 'LATE', 'ABSENT'] as const

export default function AttendancePage() {
  const [batches, setBatches] = useState<any[]>([])
  const [batchId, setBatchId] = useState('')
  const [date, setDate] = useState(today())
  const [roster, setRoster] = useState<any[] | null>(null)
  const [marks, setMarks] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    api('/api/batches').then((b) => {
      setBatches(b)
      if (b.length > 0) setBatchId(b[0].id)
    }).catch((e) => setError(e.message))
  }, [])

  useEffect(() => {
    if (!batchId || !date) return
    setRoster(null)
    api(`/api/attendance?batchId=${batchId}&date=${date}`)
      .then((d) => {
        setRoster(d.roster)
        const m: Record<string, string> = {}
        for (const r of d.roster) m[r.studentId] = 'PRESENT'
        for (const rec of d.records) m[rec.studentId] = rec.status
        setMarks(m)
      })
      .catch((e) => setError(e.message))
  }, [batchId, date])

  async function save() {
    if (!roster || roster.length === 0) return
    setBusy(true)
    setError('')
    try {
      await api('/api/attendance', {
        method: 'POST',
        body: JSON.stringify({
          batchId,
          date,
          records: roster.map((r) => ({ studentId: r.studentId, status: marks[r.studentId] || 'PRESENT' })),
        }),
      })
      toast(`Attendance saved for ${roster.length} students`)
    } catch (err: any) { setError(err.message) }
    setBusy(false)
  }

  async function sendAlerts() {
    try {
      const institute = await api('/api/stats')
      if (institute.plan !== 'PRO') {
        alert('⚠️ Feature Locked: Upgrade to PRO to send WhatsApp alerts to parents!')
        return
      }
      const res = await api('/api/notifications/send', { method: 'POST' })
      toast(`📢 ${res.message}`)
    } catch (err: any) {
      toast(err.message, 'err')
    }
  }

  return (
    <PageTransition>
      <h1>Attendance</h1>
      <div className="card">
        <div className="toolbar">
          <div>
            <label>Batch</label>
            <select value={batchId} onChange={(e) => setBatchId(e.target.value)}>
              {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', paddingBottom: 4 }}>
            <button className="btn outline" onClick={sendAlerts}>📢 Send Alerts</button>
          </div>
        </div>
        {!batchId ? (
          <p className="muted">Create a batch first to mark attendance.</p>
        ) : !roster ? (
          <div className="skeleton" style={{ height: 140 }} />
        ) : roster.length === 0 ? (
          <p className="muted">No students enrolled in this batch yet.</p>
        ) : (
          <>
            <table>
              <thead><tr><th>Student</th><th>Status</th></tr></thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {roster.map((r, idx) => (
                    <motion.tr
                      key={r.studentId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2, delay: idx * 0.04 }}
                    >
                      <td><strong>{r.name}</strong></td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {STATUSES.map((s) => (
                            <button
                              key={s}
                              type="button"
                              className={`chip ${marks[r.studentId] === s ? `on-${s.toLowerCase()}` : ''}`}
                              onClick={() => setMarks({ ...marks, [r.studentId]: s })}
                            >
                              {s === 'PRESENT' ? '✓ Present' : s === 'LATE' ? '⏰ Late' : '✕ Absent'}
                            </button>
                          ))}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
            <div style={{ marginTop: 16 }}>
              <button className="btn" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save attendance'}</button>
            </div>
          </>
        )}
        {error && <p className="error">{error}</p>}
      </div>
    </PageTransition>
  )
}
