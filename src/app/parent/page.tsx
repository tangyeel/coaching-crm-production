'use client'

import { useState, useEffect, useRef } from 'react'
import { Chart } from 'chart.js'
import { DY, getGrade, getGradeColor, getGradeBadge, getInitials, statusBadge, fmt } from '@/lib/portal-mock-data'
import { api } from '@/lib/client'

export default function ParentDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const trendRef = useRef<HTMLCanvasElement>(null)
  const attRef = useRef<HTMLCanvasElement>(null)
  const trendInst = useRef<Chart | null>(null)
  const attInst = useRef<Chart | null>(null)

  useEffect(() => {
    api('/api/student/dashboard')
      .then((res) => {
        setData(res)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load parent dashboard data:', err)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (loading || !data) return

    const myEx = data.results || []
    const myAt = data.attendance?.records || []

    if (trendRef.current && myEx.length > 0) {
      trendInst.current?.destroy()
      const ctx = trendRef.current.getContext('2d')!
      const g = ctx.createLinearGradient(0, 0, 0, 250)
      g.addColorStop(0, 'rgba(240,180,41,.2)')
      g.addColorStop(1, 'rgba(240,180,41,0)')
      trendInst.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: myEx.map((e: any) => e.name.length > 10 ? e.name.substring(0, 10) + '..' : e.name),
          datasets: [{ data: myEx.map((e: any) => e.pct), borderColor: '#F0B429', backgroundColor: g, fill: true, tension: 0.4, pointRadius: 5, pointBackgroundColor: myEx.map((e: any) => e.pct >= 70 ? '#10B981' : e.pct >= 50 ? '#F0B429' : '#EF4444'), pointBorderColor: '#08080D', pointBorderWidth: 2, borderWidth: 2.5 }],
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(42,42,58,.3)' }, min: 0, max: 100, ticks: { callback: v => v + '%' } } }, plugins: { legend: { display: false } } },
      })
    }

    if (attRef.current) {
      attInst.current?.destroy()
      const ctx = attRef.current.getContext('2d')!
      const g = ctx.createLinearGradient(0, 0, 0, 220)
      g.addColorStop(0, 'rgba(16,185,129,.2)')
      g.addColorStop(1, 'rgba(16,185,129,0)')

      // Map last 7 days of attendance
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
      trendInst.current?.destroy()
      attInst.current?.destroy()
    }
  }, [loading, data])

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--t3)' }}>Loading dashboard details...</div>
  }

  if (!data) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--err)' }}>Failed to load dashboard data.</div>
  }

  const ch = data.student
  const myEx = data.results || []
  const av = getInitials(ch.name, 0)
  const chSB = statusBadge(ch.is_active ? 'active' : 'inactive')
  const feeStatusStr = ch.fee_status === 'PAID' ? 'paid' : 'due'
  const feeSB = statusBadge(feeStatusStr)

  return (
    <div>
      <div className="si si-1" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, borderRadius: 12, marginBottom: 20, background: 'var(--bg2)', border: '1px solid var(--bdr)' }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, background: av.bg, color: av.color }}>{av.initials}</div>
        <div>
          <p className="font-display" style={{ fontWeight: 600, margin: 0, color: 'var(--t1)' }}>{ch.name}</p>
          <p style={{ fontSize: 12, margin: 0, color: 'var(--t3)' }}>{ch.email} — Guardian: {ch.guardian_name || 'Not Specified'} ({ch.guardian_phone || '—'})</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
          <span className={'badge ' + chSB.cls}><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />{chSB.label}</span>
          <span className={'badge ' + feeSB.cls}><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />{feeSB.label}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
        {[
          { label: 'Attendance', val: data.attendance?.percentage + '%', icon: 'fa-clipboard-check', bg: 'var(--okd)', color: 'var(--ok)' },
          { label: 'Avg Score', val: data.averagePercentage + '%', icon: 'fa-chart-line', bg: 'var(--accd)', color: 'var(--acc)', sub: myEx.length + ' exams' },
          { label: 'Pending Fees', val: 'Rs ' + fmt(data.pendingFeesAmount), icon: 'fa-indian-rupee-sign', bg: 'var(--errd)', color: 'var(--err)', sub: data.pendingInvoicesCount + ' invoice(s)' },
          { label: 'Overall Grade', val: getGrade(data.averagePercentage), icon: 'fa-award', bg: 'var(--infd)', color: 'var(--inf)', valColor: getGradeColor(data.averagePercentage) },
        ].map((k, i) => (
          <div key={k.label} className={'kpi si si-' + (i + 2)}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--t3)', margin: 0 }}>{k.label}</p>
              <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: k.bg }}><i className={'fa-solid ' + k.icon} style={{ fontSize: 11, color: k.color }} /></div>
            </div>
            <p className="font-display" style={{ fontWeight: 700, fontSize: 24, margin: 0, color: k.valColor || 'var(--t1)' }}>{k.val}</p>
            {k.sub && <p style={{ fontSize: 11, color: 'var(--t3)', margin: 0 }}>{k.sub}</p>}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="card si si-3">
          <h3 className="font-display" style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, color: 'var(--t1)' }}>Score Trend</h3>
          <div style={{ height: 220 }}>
            {myEx.length > 0 ? (
              <canvas ref={trendRef} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--t3)', fontSize: 12 }}>No test scores recorded yet</div>
            )}
          </div>
        </div>
        <div className="card si si-4">
          <h3 className="font-display" style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, color: 'var(--t1)' }}>Attendance</h3>
          <div style={{ height: 220 }}><canvas ref={attRef} /></div>
        </div>
      </div>

      <div className="card si si-5">
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
    </div>
  )
}
