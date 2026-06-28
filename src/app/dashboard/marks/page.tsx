'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/client'
import { motion, AnimatePresence } from 'framer-motion'
import PageTransition from '@/components/PageTransition'
import { useToast } from '@/components/Toast'

const emptyExam = { name: '', maxMarks: 100, date: new Date().toISOString().slice(0, 10) }

export default function MarksPage() {
  const [batches, setBatches] = useState<any[]>([])
  const [batchId, setBatchId] = useState('')
  const [exams, setExams] = useState<any[] | null>(null)
  const [examForm, setExamForm] = useState(emptyExam)
  const [examId, setExamId] = useState('')
  const [sheet, setSheet] = useState<any>(null)
  const [scores, setScores] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    api('/api/batches').then((b) => {
      setBatches(b)
      if (b.length > 0) setBatchId(b[0].id)
    }).catch((e) => setError(e.message))
  }, [])

  const loadExams = (bid: string) =>
    api(`/api/exams?batchId=${bid}`).then((e) => {
      setExams(e)
      setExamId(e.length > 0 ? e[0].id : '')
    }).catch((e) => setError(e.message))

  useEffect(() => {
    if (!batchId) return
    setExams(null)
    setSheet(null)
    loadExams(batchId)
  }, [batchId])

  useEffect(() => {
    if (!examId) { setSheet(null); return }
    setSheet(null)
    api(`/api/marks?examId=${examId}`).then((d) => {
      setSheet(d)
      const s: Record<string, string> = {}
      for (const m of d.marks) s[m.studentId] = String(m.score)
      setScores(s)
    }).catch((e) => setError(e.message))
  }, [examId])

  async function createExam(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const exam = await api('/api/exams', {
        method: 'POST',
        body: JSON.stringify({ batchId, name: examForm.name, maxMarks: Number(examForm.maxMarks), date: examForm.date }),
      })
      setExamForm(emptyExam)
      await loadExams(batchId)
      setExamId(exam.id)
    } catch (err: any) { setError(err.message) }
    setBusy(false)
  }

  async function saveMarks() {
    if (!sheet) return
    setBusy(true)
    setError('')
    try {
      const marks = sheet.roster
        .filter((r: any) => scores[r.studentId] !== undefined && scores[r.studentId] !== '')
        .map((r: any) => ({ studentId: r.studentId, score: Number(scores[r.studentId]) }))
      if (marks.length === 0) throw new Error('Enter at least one score')
      await api('/api/marks', { method: 'POST', body: JSON.stringify({ examId, marks }) })
      toast(`Saved marks for ${marks.length} students`)
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
      <h1>Marks &amp; Exams</h1>
      <div className="card">
        <div className="toolbar">
          <div>
            <label>Batch</label>
            <select value={batchId} onChange={(e) => setBatchId(e.target.value)}>
              {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label>Exam</label>
            <select value={examId} onChange={(e) => setExamId(e.target.value)}>
              {(exams ?? []).map((x) => <option key={x.id} value={x.id}>{x.name} (/{x.maxMarks})</option>)}
            </select>
          </div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', paddingBottom: 4 }}>
            <button className="btn outline" onClick={sendAlerts}>📢 Send Alerts</button>
          </div>
        </div>
        <h2>New exam</h2>
        <form className="row" onSubmit={createExam}>
          <div><label>Name</label><input value={examForm.name} onChange={(e) => setExamForm({ ...examForm, name: e.target.value })} required /></div>
          <div><label>Max marks</label><input type="number" min={1} value={examForm.maxMarks} onChange={(e) => setExamForm({ ...examForm, maxMarks: Number(e.target.value) })} required /></div>
          <div><label>Date</label><input type="date" value={examForm.date} onChange={(e) => setExamForm({ ...examForm, date: e.target.value })} required /></div>
          <button className="btn" disabled={busy || !batchId}>Create exam</button>
        </form>
        {error && <p className="error">{error}</p>}
      </div>

      {examId && (
        <div className="card">
          {!sheet ? (
            <div className="skeleton" style={{ height: 140 }} />
          ) : (
            <>
              <h2>{sheet.exam.name} · out of {sheet.exam.maxMarks}</h2>
              {sheet.roster.length === 0 ? (
                <p className="muted">No students enrolled in this batch.</p>
              ) : (
                <>
                  <table>
                    <thead><tr><th>Student</th><th style={{ width: 160 }}>Score</th><th>%</th></tr></thead>
                    <tbody>
                      <AnimatePresence mode="popLayout">
                        {sheet.roster.map((r: any, idx: number) => {
                          const v = scores[r.studentId] ?? ''
                          const pct = v === '' ? null : Math.round((Number(v) / sheet.exam.maxMarks) * 100)
                          return (
                            <motion.tr
                              key={r.studentId}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.98 }}
                              transition={{ duration: 0.2, delay: idx * 0.04 }}
                            >
                              <td><strong>{r.name}</strong></td>
                              <td>
                                <input
                                  type="text"
                                  placeholder="e.g. 45 or AB"
                                  value={v}
                                  onChange={(e) => {
                                    const val = e.target.value.toUpperCase();
                                    if (val === 'A' || val === 'AB' || val === '' || !isNaN(Number(val))) {
                                      setScores({ ...scores, [r.studentId]: val });
                                    }
                                  }}
                                  style={{ width: 100 }}
                                />
                              </td>
                              <td>{pct === null ? <span className="muted">-</span> : <span className={`badge ${pct >= 60 ? 'green' : pct >= 40 ? 'amber' : 'red'}`}>{pct}%</span>}</td>
                            </motion.tr>
                          )
                        })}
                      </AnimatePresence>
                    </tbody>
                  </table>
                  <div style={{ marginTop: 16 }}>
                    <button className="btn" onClick={saveMarks} disabled={busy}>{busy ? 'Saving…' : 'Save marks'}</button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </PageTransition>
  )
}
