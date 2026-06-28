'use client'

import { useState, useEffect, useRef } from 'react'
import { Chart } from 'chart.js'
import { DY, getGradeColor, getGradeBadge, statusBadge } from '@/lib/portal-mock-data'
import { api } from '@/lib/client'

export default function StudentDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const scoreRef = useRef<HTMLCanvasElement>(null)
  const attRef = useRef<HTMLCanvasElement>(null)
  const scoreInst = useRef<Chart | null>(null)
  const attInst = useRef<Chart | null>(null)

  useEffect(() => {
    api('/api/student/dashboard')
      .then((res) => {
        setData(res)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load student dashboard data:', err)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (loading || !data) return

    const myEx = data.results || []
    const myAt = data.attendance?.records || []

    if (scoreRef.current && myEx.length > 0) {
      scoreInst.current?.destroy()
      const ctx = scoreRef.current.getContext('2d')!
      const g = ctx.createLinearGradient(0, 0, 0, 220)
      g.addColorStop(0, 'rgba(240,180,41,.7)')
      g.addColorStop(1, 'rgba(240,180,41,.1)')
      scoreInst.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: myEx.map((e: any) => e.name.length > 12 ? e.name.substring(0, 12) + '..' : e.name),
          datasets: [{ label: 'Score %', data: myEx.map((e: any) => e.pct), backgroundColor: g, borderRadius: 6, borderSkipped: false, barPercentage: 0.55 }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(42,42,58,.3)' }, min: 0, max: 100, ticks: { callback: v => v + '%' } } },
          plugins: { legend: { display: false } }
        },
      })
    }

    if (attRef.current) {
      attInst.current?.destroy()
      const ctx = attRef.current.getContext('2d')!
      const g = ctx.createLinearGradient(0, 0, 0, 220)
      g.addColorStop(0, 'rgba(16,185,129,.2)')
      g.addColorStop(1, 'rgba(16,185,129,0)')

      // Use actual recent attendance or map 7 days
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(Date.now() - (6 - i) * 864e5).toISOString().slice(0, 10)
        const match = myAt.find((a: any) => a.date === d)
        return {
          day: new Date(Date.now() - (6 - i) * 864e5).toLocaleDateString('en-US', { weekday: 'short' }),
          status: match?.status || 'NONE'
        }
      })

      const ptCols = last7Days.map(a => a.status === 'PRESENT' ? '#10B981' : a.status === 'LATE' ? '#F0B429' : a.status === 'ABSENT' ? '#EF4444' : '#55556A')
      attInst.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: last7Days.map(d => d.day),
          datasets: [{
            data: last7Days.map(a => a.status === 'PRESENT' ? 1 : a.status === 'LATE' ? 0.5 : 0),
            borderColor: '#10B981',
            backgroundColor: g,
            fill: true,
            tension: 0.4,
            pointRadius: 7,
            pointBackgroundColor: ptCols,
            pointBorderColor: '#08080D',
            pointBorderWidth: 2,
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { x: { grid: { display: false } }, y: { display: false, min: 0, max: 1.3 } },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: ctx => {
                  const st = last7Days[ctx.dataIndex]?.status || 'No record'
                  return st.charAt(0).toUpperCase() + st.slice(1).toLowerCase()
                }
              }
            }
          }
        },
      })
    }

    return () => {
      scoreInst.current?.destroy()
      attInst.current?.destroy()
    }
  }, [loading, data])

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--t3)' }}>Loading dashboard details...</div>
  }

  if (!data) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--err)' }}>Failed to load dashboard data.</div>
  }

  const me = data.student
  const myEx = data.results || []
  const feeStatusStr = me.fee_status === 'PAID' ? 'paid' : 'due'
  const feeSB = statusBadge(feeStatusStr)

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
        <div className="kpi si si-1">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--t3)' }}>Attendance</p>
            <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--okd)' }}><i className="fa-solid fa-clipboard-check" style={{ fontSize: 11, color: 'var(--ok)' }} /></div>
          </div>
          <p className="font-display" style={{ fontWeight: 700, fontSize: 24, margin: 0 }}>{data.attendance?.percentage}%</p>
        </div>
        <div className="kpi si si-2">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--t3)' }}>Avg Score</p>
            <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accd)' }}><i className="fa-solid fa-chart-line" style={{ fontSize: 11, color: 'var(--acc)' }} /></div>
          </div>
          <p className="font-display" style={{ fontWeight: 700, fontSize: 24, margin: 0 }}>{data.averagePercentage}%</p>
          <p style={{ fontSize: 11, color: 'var(--t3)', margin: 0 }}>{myEx.length} exams</p>
        </div>
        <div className="kpi si si-3">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--t3)' }}>Best</p>
            <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--infd)' }}><i className="fa-solid fa-trophy" style={{ fontSize: 11, color: 'var(--inf)' }} /></div>
          </div>
          <p className="font-display" style={{ fontWeight: 700, fontSize: 24, margin: 0 }}>{data.bestPercentage}%</p>
        </div>
        <div className="kpi si si-4">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--t3)' }}>Fee Status</p>
            <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--purd)' }}><i className="fa-solid fa-indian-rupee-sign" style={{ fontSize: 11, color: 'var(--pur)' }} /></div>
          </div>
          <div style={{ marginTop: 4 }}><span className={'badge ' + feeSB.cls}><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />{feeSB.label}</span></div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="card si si-2">
          <h3 className="font-display" style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, color: 'var(--t1)' }}>Score Trend</h3>
          <div style={{ height: 220 }}>
            {myEx.length > 0 ? (
              <canvas ref={scoreRef} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--t3)', fontSize: 12 }}>No exam results posted yet</div>
            )}
          </div>
        </div>
        <div className="card si si-3">
          <h3 className="font-display" style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, color: 'var(--t1)' }}>Weekly Attendance</h3>
          <div style={{ height: 220 }}><canvas ref={attRef} /></div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 20 }}>
        <div className="card si si-4">
          <h3 className="font-display" style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, color: 'var(--t1)' }}>Recent Results</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="dt">
              <thead><tr><th>Exam</th><th>Subject</th><th>Score</th><th>%</th><th>Grade</th></tr></thead>
              <tbody>
                {[...myEx].reverse().slice(0, 5).map((e: any, idx: number) => (
                  <tr key={e.id || idx}>
                    <td style={{ color: 'var(--t1)', fontWeight: 500 }}>{e.name}</td>
                    <td><span className="badge b-inf">{e.subject}</span></td>
                    <td style={{ fontWeight: 600, color: 'var(--t1)' }}>{e.score}/{e.total}</td>
                    <td><span className={'badge ' + getGradeBadge(e.pct)}>{e.pct}%</span></td>
                    <td><span className="font-display" style={{ fontWeight: 700, color: getGradeColor(e.pct) }}>{e.grade}</span></td>
                  </tr>
                ))}
                {myEx.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--t3)' }}>No recent test marks posted</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card si si-5">
          <h3 className="font-display" style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, color: 'var(--t1)' }}>Announcements</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(data.announcements || []).map((a: any) => (
              <div key={a.id} style={{ padding: 12, borderRadius: 8, background: 'var(--bg2)', border: '1px solid var(--bdr)' }}>
                <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 2, color: 'var(--t1)' }}>{a.title}</p>
                <p style={{ fontSize: 11, color: 'var(--t3)', margin: 0 }}>{a.body.substring(0, 80)}...</p>
              </div>
            ))}
            {(!data.announcements || data.announcements.length === 0) && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120, color: 'var(--t3)', fontSize: 12 }}>No announcements posted yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
