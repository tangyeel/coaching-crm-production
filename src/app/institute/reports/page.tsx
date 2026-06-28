'use client'

import { useState, useEffect, useRef } from 'react'
import { api } from '@/lib/client'
import { fmt, getGradeBadge } from '@/lib/portal-mock-data'
import { useToast } from '@/components/Toast'
import { Chart } from 'chart.js'

interface Batch {
  id: string
  name: string
}

interface AttendanceRow {
  studentId: string
  name: string
  present: number
  late: number
  absent: number
  total: number
  percentage: number | null
}

interface PerformanceRow {
  studentId: string
  name: string
  perExam: Array<{ exam: string; score: number | 'AB' | null; maxMarks: number }>
  percentage: number | null
  grade: string | null
}

export default function InstituteReportsPage() {
  const { toast } = useToast()
  const [batches, setBatches] = useState<Batch[]>([])
  const [aB, setAB] = useState('')
  const [attRows, setAttRows] = useState<AttendanceRow[]>([])
  const [perfRows, setPerfRows] = useState<PerformanceRow[]>([])
  const [loading, setLoading] = useState(true)

  const barRef = useRef<HTMLCanvasElement>(null)
  const donutRef = useRef<HTMLCanvasElement>(null)
  const barChart = useRef<Chart | null>(null)
  const donutChart = useRef<Chart | null>(null)

  // 1. Load Batches
  useEffect(() => {
    api('/api/batches')
      .then((data: Batch[]) => {
        setBatches(data)
        if (data.length > 0) {
          setAB(data[0].id)
        } else {
          setLoading(false)
        }
      })
      .catch(err => {
        toast(err.message, 'err')
        setLoading(false)
      })
  }, [])

  // 2. Fetch Reports on Batch Change
  useEffect(() => {
    if (!aB) return
    setLoading(true)
    Promise.all([
      api(`/api/reports/attendance?batchId=${aB}`),
      api(`/api/reports/performance?batchId=${aB}`)
    ])
      .then(([attData, perfData]) => {
        setAttRows(attData.rows || [])
        setPerfRows(perfData.rows || [])
      })
      .catch(err => toast(err.message, 'err'))
      .finally(() => setLoading(false))
  }, [aB])

  // 3. Math calculations
  const aa = attRows.length
    ? Math.round(attRows.reduce((acc, r) => acc + (r.percentage ?? 0), 0) / attRows.length)
    : 0
  const as2 = perfRows.length
    ? Math.round(perfRows.reduce((acc, r) => acc + (r.percentage ?? 0), 0) / perfRows.length)
    : 0

  const gd = { Ap: 0, A: 0, B: 0, C: 0, D: 0, F: 0 }
  perfRows.forEach(r => {
    if (!r.grade) return
    const g = r.grade.toUpperCase()
    if (g === 'A+') gd.Ap++
    else if (g === 'A') gd.A++
    else if (g === 'B') gd.B++
    else if (g === 'C') gd.C++
    else if (g === 'D') gd.D++
    else gd.F++
  })

  const legend = [
    { grade: 'A+', count: gd.Ap, color: '#10B981' },
    { grade: 'A', count: gd.A, color: '#06B6D4' },
    { grade: 'B', count: gd.B, color: '#F0B429' },
    { grade: 'C', count: gd.C, color: '#A855F7' },
    { grade: 'D', count: gd.D, color: '#EF4444' },
    { grade: 'F', count: gd.F, color: '#55556A' },
  ]

  // 4. Render Charts
  useEffect(() => {
    if (loading || attRows.length === 0) return

    if (barRef.current) {
      barChart.current?.destroy()
      const ctx = barRef.current.getContext('2d')!
      const top10 = attRows.slice(0, 10)
      barChart.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: top10.map(s => s.name.split(' ')[0]),
          datasets: [
            { label: 'Present', data: top10.map(s => s.present), backgroundColor: 'rgba(16,185,129,.7)', borderRadius: 4, barPercentage: 0.6 },
            { label: 'Late', data: top10.map(s => s.late), backgroundColor: 'rgba(240,180,41,.7)', borderRadius: 4, barPercentage: 0.6 },
            { label: 'Absent', data: top10.map(s => s.absent), backgroundColor: 'rgba(239,68,68,.7)', borderRadius: 4, barPercentage: 0.6 },
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { stacked: true, grid: { display: false } },
            y: { stacked: true, grid: { color: 'rgba(42,42,58,.3)' }, beginAtZero: true }
          },
          plugins: { legend: { position: 'top', labels: { font: { size: 10 } } } }
        }
      })
    }

    if (donutRef.current) {
      donutChart.current?.destroy()
      donutChart.current = new Chart(donutRef.current.getContext('2d')!, {
        type: 'doughnut',
        data: {
          labels: ['A+', 'A', 'B', 'C', 'D', 'F'],
          datasets: [{
            data: [gd.Ap, gd.A, gd.B, gd.C, gd.D, gd.F],
            backgroundColor: ['#10B981', '#06B6D4', '#F0B429', '#A855F7', '#EF4444', '#55556A'],
            borderWidth: 0,
            hoverOffset: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '65%',
          plugins: { legend: { display: false } }
        }
      })
    }

    return () => {
      barChart.current?.destroy()
      donutChart.current?.destroy()
    }
  }, [loading, attRows, perfRows])

  const downloadCSV = (type: 'attendance' | 'performance') => {
    if (!aB) return
    window.open(`/api/reports/${type}?batchId=${aB}&format=csv`, '_blank')
    toast(`${type.toUpperCase()} CSV download started`)
  }

  return (
    <div>
      <div className="si si-1" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <select className="fi fi-sm" value={aB} onChange={e => setAB(e.target.value)}>
          {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          {batches.length === 0 && <option value="">No batches</option>}
        </select>
        <button className="btn btn-ghost btn-sm" disabled={!aB} onClick={() => downloadCSV('attendance')}>
          <i className="fa-solid fa-file-csv" style={{ marginRight: 6 }} />Attendance CSV
        </button>
        <button className="btn btn-ghost btn-sm" disabled={!aB} onClick={() => downloadCSV('performance')}>
          <i className="fa-solid fa-file-csv" style={{ marginRight: 6 }} />Performance CSV
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--t3)' }}>Loading analytics reports...</div>
      ) : attRows.length === 0 ? (
        <div className="card si si-2" style={{ textAlign: 'center', padding: '48px' }}>
          <p style={{ color: 'var(--t3)' }}>No student records found in this batch.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 20 }}>
            <div className="kpi si si-2">
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--t3)', marginBottom: 8 }}>Avg Attendance</p>
              <p className="font-display" style={{ fontWeight: 700, fontSize: 24, margin: 0 }}>{aa}%</p>
            </div>
            <div className="kpi si si-3">
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--t3)', marginBottom: 8 }}>Avg Score</p>
              <p className="font-display" style={{ fontWeight: 700, fontSize: 24, margin: 0 }}>{as2}%</p>
            </div>
            <div className="kpi si si-4">
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--t3)', marginBottom: 8 }}>Total Students</p>
              <p className="font-display" style={{ fontWeight: 700, fontSize: 24, margin: 0 }}>{attRows.length}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 20, marginBottom: 20 }}>
            <div className="card si si-3">
              <h3 className="font-display" style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, color: 'var(--t1)' }}>Attendance Summary (Top 10 Students)</h3>
              <div style={{ height: 220 }}><canvas ref={barRef} /></div>
            </div>
            <div className="card si si-4">
              <h3 className="font-display" style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, color: 'var(--t1)' }}>Grades Distribution</h3>
              <div style={{ height: 180 }}><canvas ref={donutRef} /></div>
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {legend.map(l => (
                  <div key={l.grade} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
                      <span style={{ color: 'var(--t2)' }}>{l.grade}</span>
                    </div>
                    <span style={{ color: 'var(--t1)', fontWeight: 600 }}>{l.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card si si-5" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="dt">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Attendance %</th>
                  <th>Overall Score %</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                {perfRows.map((s, i) => {
                  const att = attRows.find(x => x.studentId === s.studentId)
                  const av = {
                    bg: ['var(--accd)', 'var(--infd)', 'var(--okd)', 'var(--purd)'][i % 4],
                    color: ['var(--acc)', 'var(--inf)', 'var(--ok)', 'var(--pur)'][i % 4],
                    initials: s.name.split(' ').map(n => n[0]).join('')
                  }
                  return (
                    <tr key={s.studentId}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, background: av.bg, color: av.color }}>{av.initials}</div>
                          <span style={{ color: 'var(--t1)', fontWeight: 500 }}>{s.name}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--t1)', fontWeight: 600 }}>{att && att.percentage !== null ? `${att.percentage}%` : '—'}</td>
                      <td>
                        {s.percentage !== null ? (
                          <span className={'badge ' + getGradeBadge(s.percentage)}>{s.percentage}%</span>
                        ) : '—'}
                      </td>
                      <td>
                        {s.percentage !== null && s.grade ? (
                          <span className="font-display" style={{ fontWeight: 700, color: 'var(--t1)' }}>{s.grade}</span>
                        ) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}



