'use client'

import { useState, useEffect, useRef } from 'react'
import { Chart } from 'chart.js'
import { getGrade, getGradeColor, getGradeBadge } from '@/lib/portal-mock-data'
import { api } from '@/lib/client'

export default function ParentMarksPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const trendRef = useRef<HTMLCanvasElement>(null)
  const donutRef = useRef<HTMLCanvasElement>(null)
  const trendInst = useRef<Chart | null>(null)
  const donutInst = useRef<Chart | null>(null)

  useEffect(() => {
    api('/api/student/dashboard')
      .then((res) => {
        setData(res)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load child performance data:', err)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (loading || !data) return

    const myEx = data.results || []

    // Calculate Grade Distribution
    const gd = { Ap: 0, A: 0, Bp: 0, B: 0, C: 0, F: 0 }
    myEx.forEach((r: any) => {
      if (r.grade === 'A+') gd.Ap++
      else if (r.grade === 'A') gd.A++
      else if (r.grade === 'B+') gd.Bp++
      else if (r.grade === 'B') gd.B++
      else if (r.grade === 'C') gd.C++
      else gd.F++
    })

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
          datasets: [{ data: myEx.map((e: any) => e.pct), borderColor: '#F0B429', backgroundColor: g, fill: true, tension: 0.4, pointRadius: 5, pointBackgroundColor: myEx.map((e: any) => e.pct >= 70 ? '#10B981' : e.pct >= 50 ? '#F0B429' : '#EF4444'), pointBorderColor: '#08080D', pointBorderWidth: 2, borderWidth: 2.5 }]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(42,42,58,.3)' }, min: 0, max: 100, ticks: { callback: v => v + '%' } } }, plugins: { legend: { display: false } } },
      })
    }

    if (donutRef.current) {
      donutInst.current?.destroy()
      donutInst.current = new Chart(donutRef.current.getContext('2d')!, {
        type: 'doughnut',
        data: {
          labels: ['A+', 'A', 'B+', 'B', 'C', 'F'],
          datasets: [{ data: [gd.Ap, gd.A, gd.Bp, gd.B, gd.C, gd.F], backgroundColor: ['#10B981', '#06B6D4', '#F0B429', '#A855F7', '#EF4444', '#55556A'], borderWidth: 0, hoverOffset: 6 }]
        },
        options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { display: false } } },
      })
    }

    return () => {
      trendInst.current?.destroy()
      donutInst.current?.destroy()
    }
  }, [loading, data])

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--t3)' }}>Loading child performance data...</div>
  }

  if (!data) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--err)' }}>Failed to load child performance data.</div>
  }

  const myEx = data.results || []
  const avg = data.averagePercentage
  const best = myEx.length ? myEx.reduce((b: any, e: any) => e.pct > b.pct ? e : b, myEx[0]) : null
  const worst = myEx.length ? myEx.reduce((b: any, e: any) => e.pct < b.pct ? e : b, myEx[0]) : null

  // Calculate Grade Distribution and legend
  const gd = { Ap: 0, A: 0, Bp: 0, B: 0, C: 0, F: 0 }
  myEx.forEach((r: any) => {
    if (r.grade === 'A+') gd.Ap++
    else if (r.grade === 'A') gd.A++
    else if (r.grade === 'B+') gd.Bp++
    else if (r.grade === 'B') gd.B++
    else if (r.grade === 'C') gd.C++
    else gd.F++
  })

  const legend = [
    { grade: 'A+', count: gd.Ap, color: '#10B981' },
    { grade: 'A', count: gd.A, color: '#06B6D4' },
    { grade: 'B+', count: gd.Bp, color: '#F0B429' },
    { grade: 'B', count: gd.B, color: '#A855F7' },
    { grade: 'C', count: gd.C, color: '#EF4444' },
    { grade: 'F', count: gd.F, color: '#55556A' },
  ]

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
        <div className="kpi si si-1"><p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--t3)', marginBottom: 8 }}>Exams</p><p className="font-display" style={{ fontWeight: 700, fontSize: 24, margin: 0 }}>{myEx.length}</p></div>
        <div className="kpi si si-2"><p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--t3)', marginBottom: 8 }}>Average</p><p className="font-display" style={{ fontWeight: 700, fontSize: 24, margin: 0 }}>{avg}%</p><p style={{ fontSize: 11, color: 'var(--t3)', margin: 0 }}>Grade: <strong style={{ color: getGradeColor(avg) }}>{getGrade(avg)}</strong></p></div>
        <div className="kpi si si-3"><p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--t3)', marginBottom: 8 }}>Best</p><p className="font-display" style={{ fontWeight: 700, fontSize: 24, margin: 0 }}>{best ? best.pct : 0}%</p><p style={{ fontSize: 11, color: 'var(--t3)', margin: 0 }}>{best ? best.name : '—'}</p></div>
        <div className="kpi si si-4"><p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--t3)', marginBottom: 8 }}>Needs Work</p><p className="font-display" style={{ fontWeight: 700, fontSize: 24, margin: 0 }}>{worst ? worst.pct : 0}%</p><p style={{ fontSize: 11, color: 'var(--t3)', margin: 0 }}>{worst ? worst.name : '—'}</p></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '8fr 4fr', gap: 20, marginBottom: 20 }}>
        <div className="card si si-2">
          <h3 className="font-display" style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, color: 'var(--t1)' }}>Score Trend</h3>
          <div style={{ height: 250 }}>
            {myEx.length > 0 ? (
              <canvas ref={trendRef} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--t3)', fontSize: 12 }}>No test scores recorded yet</div>
            )}
          </div>
        </div>
        <div className="card si si-3">
          <h3 className="font-display" style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, color: 'var(--t1)' }}>Grades</h3>
          <div style={{ height: 180 }}><canvas ref={donutRef} /></div>
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {legend.map(l => (
              <div key={l.grade} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} /><span style={{ color: 'var(--t2)' }}>{l.grade}</span></div>
                <span style={{ color: 'var(--t1)', fontWeight: 600 }}>{l.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card si si-4">
        <h3 className="font-display" style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, color: 'var(--t1)' }}>All Results</h3>
        {myEx.map((e: any, i: number) => (
          <div key={e.id || i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 0', borderBottom: i < myEx.length - 1 ? '1px solid rgba(42,42,58,.3)' : 'none' }}>
            <div style={{ flex: 1 }}>
              <p style={{ color: 'var(--t1)', fontWeight: 500, fontSize: 14, margin: 0 }}>{e.name}</p>
              <p style={{ fontSize: 11, color: 'var(--t3)', margin: 0 }}>{e.subject} — {e.date}</p>
            </div>
            <div style={{ width: 140 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'var(--bg2)' }}><div style={{ height: '100%', borderRadius: 4, width: e.pct + '%', background: getGradeColor(e.pct), transition: 'width .8s' }} /></div>
                <span style={{ fontSize: 12, fontWeight: 600, color: getGradeColor(e.pct) }}>{e.pct}%</span>
              </div>
            </div>
            <span className="font-display" style={{ fontWeight: 700, fontSize: 14, width: 40, textAlign: 'center', color: getGradeColor(e.pct) }}>{e.grade}</span>
            <span style={{ fontSize: 12, color: 'var(--t2)' }}>{e.score}/{e.total}</span>
          </div>
        ))}
        {myEx.length === 0 && (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--t3)' }}>No exam marks recorded yet</div>
        )}
      </div>
    </div>
  )
}
