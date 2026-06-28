'use client'

import { useState, useEffect, useRef } from 'react'
import { Chart } from 'chart.js'
import { api } from '@/lib/client'

export default function ParentAttendancePage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const donutRef = useRef<HTMLCanvasElement>(null)
  const donutInst = useRef<Chart | null>(null)

  useEffect(() => {
    api('/api/student/dashboard')
      .then((res) => {
        setData(res)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load child attendance:', err)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (loading || !data) return

    const myAt = data.attendance?.records || []
    const pr = myAt.filter((a: any) => a.status === 'PRESENT').length
    const la = myAt.filter((a: any) => a.status === 'LATE').length
    const ab = myAt.filter((a: any) => a.status === 'ABSENT').length

    if (donutRef.current) {
      donutInst.current?.destroy()
      donutInst.current = new Chart(donutRef.current.getContext('2d')!, {
        type: 'doughnut',
        data: { labels: ['Present', 'Late', 'Absent'], datasets: [{ data: [pr, la, ab], backgroundColor: ['#10B981', '#F0B429', '#EF4444'], borderWidth: 0, hoverOffset: 8 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { display: false } } },
      })
    }
    return () => { donutInst.current?.destroy() }
  }, [loading, data])

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--t3)' }}>Loading child attendance details...</div>
  }

  if (!data) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--err)' }}>Failed to load child attendance details.</div>
  }

  const myAt = data.attendance?.records || []
  const pr = myAt.filter((a: any) => a.status === 'PRESENT').length
  const la = myAt.filter((a: any) => a.status === 'LATE').length
  const ab = myAt.filter((a: any) => a.status === 'ABSENT').length
  const pct = data.attendance?.percentage ?? 100

  const rows: [string, number, string][] = [['Present', pr, '#10B981'], ['Late', la, '#F0B429'], ['Absent', ab, '#EF4444']]

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
        <div className="kpi si si-1"><p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--t3)', marginBottom: 8 }}>Present</p><p className="font-display" style={{ fontWeight: 700, fontSize: 24, margin: 0 }}>{pr}</p></div>
        <div className="kpi si si-2"><p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--t3)', marginBottom: 8 }}>Late</p><p className="font-display" style={{ fontWeight: 700, fontSize: 24, margin: 0 }}>{la}</p></div>
        <div className="kpi si si-3"><p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--t3)', marginBottom: 8 }}>Absent</p><p className="font-display" style={{ fontWeight: 700, fontSize: 24, margin: 0 }}>{ab}</p></div>
        <div className="kpi si si-4">
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--t3)', marginBottom: 8 }}>Percentage</p>
          <p className="font-display" style={{ fontWeight: 700, fontSize: 24, margin: 0 }}>{pct}%</p>
          <div style={{ marginTop: 8, height: 6, borderRadius: 3, background: 'var(--bg2)', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 3, width: pct + '%', background: 'var(--ok)', transition: 'width .8s' }} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 20 }}>
        <div className="card si si-2">
          <h3 className="font-display" style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, color: 'var(--t1)' }}>Breakdown</h3>
          <div style={{ height: 200 }}><canvas ref={donutRef} /></div>
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rows.map(([label, count, color]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
                  <span style={{ color: 'var(--t2)' }}>{label}</span>
                </div>
                <span style={{ color: 'var(--t1)', fontWeight: 600 }}>{count} days</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card si si-3">
          <h3 className="font-display" style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, color: 'var(--t1)' }}>Day-by-Day</h3>
          <div style={{ overflowY: 'auto', maxHeight: 320 }}>
            <table className="dt">
              <thead><tr><th>Date</th><th>Status</th></tr></thead>
              <tbody>
                {myAt.map((a: any, i: number) => (
                  <tr key={a.id || i}>
                    <td style={{ color: 'var(--t1)', fontWeight: 500 }}>{new Date(a.date).toLocaleDateString()}</td>
                    <td>
                      {a.status === 'PRESENT' && <span className="badge b-ok"><i className="fa-solid fa-check" style={{ fontSize: 9, marginRight: 4 }} />Present</span>}
                      {a.status === 'LATE' && <span className="badge b-acc"><i className="fa-solid fa-clock" style={{ fontSize: 9, marginRight: 4 }} />Late</span>}
                      {a.status === 'ABSENT' && <span className="badge b-err"><i className="fa-solid fa-xmark" style={{ fontSize: 9, marginRight: 4 }} />Absent</span>}
                    </td>
                  </tr>
                ))}
                {myAt.length === 0 && (
                  <tr><td colSpan={2} style={{ textAlign: 'center', padding: 24, color: 'var(--t3)' }}>No child attendance records found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
