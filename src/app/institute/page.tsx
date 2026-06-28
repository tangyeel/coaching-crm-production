'use client'

import { useState, useEffect, useRef } from 'react'
import { Chart } from 'chart.js'
import { DY, fmt, CL } from '@/lib/portal-mock-data'
import { api } from '@/lib/client'

export default function InstituteOverview() {
  const [aB, setAB] = useState('')
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [dbBatches, setDbBatches] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api('/api/stats')
      .then(res => {
        setStats(res)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load stats:', err)
        setLoading(false)
      })

    api('/api/batches')
      .then(setDbBatches)
      .catch(err => console.error('Failed to load batches:', err))
  }, [])

  useEffect(() => {
    if (dbBatches && dbBatches.length > 0 && !aB) {
      setAB(dbBatches[0].id)
    }
  }, [dbBatches, aB])

  const getTrendData = () => {
    if (!stats?.recentAtt || !aB) return []
    const trend = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10)
      const day = stats.recentAtt.filter((r: any) => r.batch_id === aB && r.date === d)
      trend.push({
        date: d.slice(5),
        present: day.filter((r: any) => r.status === 'PRESENT').length,
        late: day.filter((r: any) => r.status === 'LATE').length,
        absent: day.filter((r: any) => r.status === 'ABSENT').length,
      })
    }
    return trend
  }
  const trendData = getTrendData()

  useEffect(() => {
    if (!chartRef.current || trendData.length === 0) return
    if (chartInstance.current) chartInstance.current.destroy()
    const ctx = chartRef.current.getContext('2d')
    if (!ctx) return
    const gp = ctx.createLinearGradient(0, 0, 0, 250)
    gp.addColorStop(0, 'rgba(16,185,129,.18)')
    gp.addColorStop(1, 'rgba(16,185,129,0)')
    const gl = ctx.createLinearGradient(0, 0, 0, 250)
    gl.addColorStop(0, 'rgba(240,180,41,.15)')
    gl.addColorStop(1, 'rgba(240,180,41,0)')
    
    const labels = trendData.map((t: any) => t.date)

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          { label: 'Present', data: trendData.map((a: any) => a.present), borderColor: '#10B981', backgroundColor: gp, fill: true, tension: 0.4, pointRadius: 3, pointBackgroundColor: '#10B981', pointBorderColor: '#08080D', pointBorderWidth: 2, borderWidth: 2 },
          { label: 'Late', data: trendData.map((a: any) => a.late), borderColor: '#F0B429', backgroundColor: gl, fill: true, tension: 0.4, pointRadius: 3, pointBackgroundColor: '#F0B429', pointBorderColor: '#08080D', pointBorderWidth: 2, borderWidth: 2 },
          { label: 'Absent', data: trendData.map((a: any) => a.absent), borderColor: '#EF4444', fill: false, tension: 0.4, pointRadius: 3, pointBackgroundColor: '#EF4444', pointBorderColor: '#08080D', pointBorderWidth: 2, borderWidth: 1.5, borderDash: [4, 3] },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false, interaction: { intersect: false, mode: 'index' },
        scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(42,42,58,.3)' }, beginAtZero: true } },
        plugins: { legend: { position: 'top', labels: { font: { size: 11 } } } },
      },
    })
    return () => { if (chartInstance.current) chartInstance.current.destroy() }
  }, [aB, stats, trendData])

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        <div className="kpi si si-1">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--t3)' }}>Students</p>
            <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--infd)' }}>
              <i className="fa-solid fa-users" style={{ fontSize: 11, color: 'var(--inf)' }}></i>
            </div>
          </div>
          <p className="font-display" style={{ fontWeight: 700, fontSize: 24, margin: 0 }}>
            {loading ? '...' : (stats?.students ?? 0)}
          </p>
          <span className="badge b-ok"><i className="fa-solid fa-arrow-up" style={{ fontSize: 8 }}></i>8.3%</span>
        </div>
        <div className="kpi si si-2">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--t3)' }}>Teachers</p>
            <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--okd)' }}>
              <i className="fa-solid fa-chalkboard-user" style={{ fontSize: 11, color: 'var(--ok)' }}></i>
            </div>
          </div>
          <p className="font-display" style={{ fontWeight: 700, fontSize: 24, margin: 0 }}>
            {loading ? '...' : (stats?.teachers ?? 0)}
          </p>
          <span className="badge b-inf">+{loading ? '...' : (stats?.teachers ?? 0)} active</span>
        </div>
        <div className="kpi si si-3">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--t3)' }}>Batches</p>
            <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accd)' }}>
              <i className="fa-solid fa-layer-group" style={{ fontSize: 11, color: 'var(--acc)' }}></i>
            </div>
          </div>
          <p className="font-display" style={{ fontWeight: 700, fontSize: 24, margin: 0 }}>
            {loading ? '...' : (stats?.batches ?? 0)}
          </p>
        </div>
        <div className="kpi si si-4">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--t3)' }}>Present Today</p>
            <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--purd)' }}>
              <i className="fa-solid fa-clipboard-check" style={{ fontSize: 11, color: 'var(--pur)' }}></i>
            </div>
          </div>
          <p className="font-display" style={{ fontWeight: 700, fontSize: 24, margin: 0 }}>
            {loading ? '...' : (stats?.presentToday ?? 0)}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '8fr 4fr', gap: 20, marginBottom: 20 }}>
        <div className="card si si-2">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>Attendance Trend</h3>
            <select className="fi fi-sm" value={aB} onChange={e => setAB(e.target.value)}>
              {(dbBatches || []).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              {(!dbBatches || dbBatches.length === 0) && <option value="">No Batches</option>}
            </select>
          </div>
          <div style={{ height: 250 }}>
            {trendData.length > 0 ? (
              <canvas ref={chartRef}></canvas>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--t3)', fontSize: 13 }}>No attendance data recorded yet</div>
            )}
          </div>
        </div>
        <div className="card si si-3">
          <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Latest Announcements</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(stats?.announcements || []).map((a: any) => (
              <div key={a.id} style={{ padding: 12, borderRadius: 8, background: 'var(--bg2)', border: '1px solid var(--bdr)' }}>
                <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 2, color: 'var(--t1)' }}>{a.title}</p>
                <p style={{ fontSize: 11, color: 'var(--t3)', margin: 0 }}>{a.body.substring(0, 80)}...</p>
              </div>
            ))}
            {(!stats?.announcements || stats.announcements.length === 0) && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 180, color: 'var(--t3)', fontSize: 12 }}>No announcements posted yet</div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card si si-4">
          <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Batch Overview</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(dbBatches || []).map((b: any, idx: number) => {
              const enr = b._count?.students ?? 0
              const cap = b.capacity ?? 30
              const pct = Math.round(enr / cap * 100)
              return (
                <div key={b.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: 'var(--t2)' }}>{b.name}</span>
                    <span style={{ color: CL[idx % 5], fontWeight: 600 }}>{enr}/{cap}</span>
                  </div>
                  <div className="cb"><div className="cf" style={{ width: pct + '%', background: CL[idx % 5] }}></div></div>
                </div>
              )
            })}
            {(!dbBatches || dbBatches.length === 0) && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 100, color: 'var(--t3)', fontSize: 12 }}>No active batches found</div>
            )}
          </div>
        </div>
        <div className="card si si-5">
          <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Quick Actions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button className="btn btn-primary btn-sm text-center" onClick={() => window.location.href = '/institute/students'}>
              <i className="fa-solid fa-users mr-1"></i>Students
            </button>
            <button className="btn btn-primary btn-sm text-center" onClick={() => window.location.href = '/institute/teachers'}>
              <i className="fa-solid fa-chalkboard-user mr-1"></i>Teachers
            </button>
            <button className="btn btn-ghost btn-sm text-center" onClick={() => window.location.href = '/institute/attendance'}>
              <i className="fa-solid fa-clipboard-check mr-1"></i>Attendance
            </button>
            <button className="btn btn-ghost btn-sm text-center" onClick={() => window.location.href = '/institute/marks'}>
              <i className="fa-solid fa-chart-column mr-1"></i>Marks
            </button>
            <button className="btn btn-ghost btn-sm text-center" onClick={() => window.location.href = '/institute/fees'}>
              <i className="fa-solid fa-indian-rupee-sign mr-1"></i>Fees
            </button>
            <button className="btn btn-ghost btn-sm text-center" onClick={() => window.location.href = '/institute/announcements'}>
              <i className="fa-solid fa-bullhorn mr-1"></i>Announce
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


