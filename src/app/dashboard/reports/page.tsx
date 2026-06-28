'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/client'
import { motion, AnimatePresence } from 'framer-motion'
import PageTransition from '@/components/PageTransition'

export default function ReportsPage() {
  const [batches, setBatches] = useState<any[]>([])
  const [batchId, setBatchId] = useState('')
  const [attendance, setAttendance] = useState<any>(null)
  const [performance, setPerformance] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/api/batches').then((b) => {
      setBatches(b)
      if (b.length > 0) setBatchId(b[0].id)
    }).catch((e) => setError(e.message))
  }, [])

  useEffect(() => {
    if (!batchId) return
    setAttendance(null)
    setPerformance(null)
    api(`/api/reports/attendance?batchId=${batchId}`).then(setAttendance).catch((e) => setError(e.message))
    api(`/api/reports/performance?batchId=${batchId}`).then(setPerformance).catch((e) => setError(e.message))
  }, [batchId])

  return (
    <PageTransition>
      <h1>Reports</h1>
      <div className="toolbar">
        <div>
          <label>Batch</label>
          <select value={batchId} onChange={(e) => setBatchId(e.target.value)}>
            {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      </div>
      {error && <p className="error">{error}</p>}

      <div className="card">
        <h2>
          📅 Attendance summary{' '}
          {batchId && <a className="btn ghost sm" style={{ color: 'var(--brand)', borderColor: 'var(--brand)', float: 'right' }} href={`/api/reports/attendance?batchId=${batchId}&format=csv`}>⬇ CSV</a>}
        </h2>
        {!attendance ? (
          <div className="skeleton" style={{ height: 120 }} />
        ) : attendance.rows.length === 0 ? (
          <p className="muted">No students enrolled.</p>
        ) : (
          <table>
            <thead><tr><th>Student</th><th>Present</th><th>Late</th><th>Absent</th><th style={{ width: '30%' }}>Attendance</th></tr></thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {attendance.rows.map((r: any, idx: number) => (
                  <motion.tr
                    key={r.studentId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2, delay: idx * 0.04 }}
                  >
                    <td><strong>{r.name}</strong></td>
                    <td>{r.present}</td>
                    <td>{r.late}</td>
                    <td>{r.absent}</td>
                    <td>
                      {r.percentage === null ? (
                        <span className="muted">No sessions</span>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="bar" style={{ flex: 1 }}><span style={{ width: `${r.percentage}%` }} /></div>
                          <span className={`badge ${r.percentage >= 75 ? 'green' : r.percentage >= 50 ? 'amber' : 'red'}`}>{r.percentage}%</span>
                        </div>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h2>
          🏆 Performance{' '}
          {batchId && <a className="btn ghost sm" style={{ color: 'var(--brand)', borderColor: 'var(--brand)', float: 'right' }} href={`/api/reports/performance?batchId=${batchId}&format=csv`}>⬇ CSV</a>}
        </h2>
        {!performance ? (
          <div className="skeleton" style={{ height: 120 }} />
        ) : performance.rows.length === 0 ? (
          <p className="muted">No students enrolled.</p>
        ) : performance.exams.length === 0 ? (
          <p className="muted">No exams created for this batch yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Student</th>
                {performance.exams.map((e: any) => <th key={e.id}>{e.name} (/{e.maxMarks})</th>)}
                <th>Overall</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {performance.rows.map((r: any, idx: number) => (
                  <motion.tr
                    key={r.studentId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2, delay: idx * 0.04 }}
                  >
                    <td><strong>{r.name}</strong></td>
                    {r.perExam.map((p: any, i: number) => <td key={i}>{p.score ?? <span className="muted">-</span>}</td>)}
                    <td>{r.percentage === null ? <span className="muted">-</span> : `${r.percentage}%`}</td>
                    <td>{r.grade ? <span className={`badge ${r.percentage >= 60 ? 'green' : r.percentage >= 50 ? 'amber' : 'red'}`}>{r.grade}</span> : <span className="muted">-</span>}</td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </div>
    </PageTransition>
  )
}
