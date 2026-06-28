'use client'

import { useEffect, useRef } from 'react'
import { Chart } from 'chart.js'
import CountUp from '../CountUp'
import { CHART_THEME_COLORS, EMERALD_GRADIENT } from '@/lib/constants'

interface MessagesTabProps {
  d: any
  escapeHTML: (str: string) => string
  instStudents: any[]
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function MessagesTab({ d, escapeHTML, instStudents }: MessagesTabProps) {
  const msgVolumeRef = useRef<HTMLCanvasElement>(null)
  const msgTypesRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const charts: Chart[] = []

    if (d) {
      // Message Volume Line Chart
      if (msgVolumeRef.current) {
        const ctx = msgVolumeRef.current.getContext('2d')
        if (ctx) {
          const g = ctx.createLinearGradient(0, 0, 0, 280)
          g.addColorStop(0, EMERALD_GRADIENT.top)
          g.addColorStop(1, EMERALD_GRADIENT.bottom)
          const chart = new Chart(ctx, {
            type: 'line',
            data: {
              labels: MONTHS,
              datasets: [{ label: 'Messages', data: d.msgMonthly || [], borderColor: '#10B981', backgroundColor: g, fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: '#10B981', pointBorderColor: '#08080D', pointBorderWidth: 2, borderWidth: 2.5, pointHoverRadius: 7 }]
            },
            options: { responsive: true, maintainAspectRatio: false, interaction: { intersect: false, mode: 'index' }, scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(42,42,58,0.3)' } } }, plugins: { legend: { display: false } } },
          })
          charts.push(chart)
        }
      }

      // Message Type Channel distribution
      if (msgTypesRef.current && d.msgTypes) {
        const ctx = msgTypesRef.current.getContext('2d')
        if (ctx) {
          const mtKeys = Object.keys(d.msgTypes)
          const chart = new Chart(ctx, {
            type: 'doughnut',
            data: { labels: mtKeys, datasets: [{ data: mtKeys.map(k => d.msgTypes[k]), backgroundColor: CHART_THEME_COLORS.slice(0, mtKeys.length), borderWidth: 0, hoverOffset: 6 }] },
            options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { display: false } } },
          })
          charts.push(chart)
        }
      }
    }

    return () => {
      charts.forEach(c => c.destroy())
    }
  }, [d])

  if (!d) return <div style={{ color: 'var(--text-3)', padding: 24, textAlign: 'center' }}>Loading messages data...</div>

  const mtKeys = Object.keys(d.msgTypes || {})

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 24 }}>
        {[
          { label: 'Total Sent', raw: d.kpi.messages, chg: d.kpi.msgChg, icon: 'fa-solid fa-message', bg: 'var(--success-dim)', c: 'var(--success)', fmt: (n: number) => n.toLocaleString('en-IN') },
          { label: 'Avg Response Time', val: d.avgRespTime, sub: 'Across all channels', icon: 'fa-solid fa-clock', bg: 'var(--accent-dim)', c: 'var(--accent)' },
          { label: 'Open Rate', raw: d.openRate, suffix: '%', sub: `Response rate: ${d.respRate}%`, icon: 'fa-solid fa-envelope-open-text', bg: 'var(--info-dim)', c: 'var(--info)', fmt: (n: number) => n + '%' },
        ].map((kpi, i) => (
          <div key={i} className={`kpi-card stagger-in stagger-${i + 1}`}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-3)', margin: 0 }}>{kpi.label}</p>
              <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: kpi.bg }}>
                <i className={kpi.icon} style={{ color: kpi.c, fontSize: 13 }}></i>
              </div>
            </div>
            <p style={{ fontFamily: 'var(--font-space)', fontWeight: 700, fontSize: 24, margin: '0 0 4px', color: 'var(--text-1)' }}>
              {kpi.raw != null ? <CountUp value={kpi.raw} formatter={kpi.fmt} /> : kpi.val}
            </p>
            {kpi.chg != null ? <span className={`badge ${kpi.chg >= 0 ? 'badge-success' : 'badge-danger'}`}><i className={`fa-solid fa-chevron-${kpi.chg >= 0 ? 'up' : 'down'}`} style={{ fontSize: 9, marginRight: 2 }}></i> {Math.abs(kpi.chg)}%</span> : <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{kpi.sub}</span>}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '8fr 4fr', gap: 20, marginBottom: 24 }}>
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: 'var(--text-1)' }}>Message Volume</h3>
          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 0 20px' }}>Monthly messages sent across all channels</p>
          <div className="chart-wrap" style={{ height: 280 }}><canvas ref={msgVolumeRef} /></div>
        </div>
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: 'var(--text-1)' }}>By Channel</h3>
          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 0 16px' }}>Message type distribution</p>
          <div className="chart-wrap" style={{ height: 200 }}><canvas ref={msgTypesRef} /></div>
          <div style={{ marginTop: 16 }}>
            {mtKeys.map((k, i) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: CHART_THEME_COLORS[i], display: 'inline-block' }} />
                  <span style={{ color: 'var(--text-2)' }}>{escapeHTML(k)}</span>
                </div>
                <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>{d.msgTypes[k].toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 16px 0', color: 'var(--text-1)' }}>Top Conversations</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead><tr><th>Student</th><th>Course</th><th>Messages</th><th>Last Message</th><th>Status</th></tr></thead>
            <tbody>
              {instStudents.slice(0, 8).map((s, i) => (
                <tr key={i}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, background: ['var(--accent-dim)', 'var(--info-dim)', 'var(--success-dim)', 'rgba(168,85,247,.12)'][i % 4], color: ['var(--accent)', 'var(--info)', 'var(--success)', '#A855F7'][i % 4] }}>
                        {escapeHTML(s.name.split(' ').map((n: string) => n[0]).join(''))}
                      </div>
                      <span style={{ color: 'var(--text-1)', fontWeight: 500 }}>{escapeHTML(s.name)}</span>
                    </div>
                  </td>
                  <td>{escapeHTML(s.course || 'General')}</td>
                  <td><span style={{ fontWeight: 600, color: 'var(--text-1)' }}>{s.messagesCount || Math.floor(Math.random() * 40 + 10)}</span></td>
                  <td>{['Asked about fee structure', 'Scheduled a demo class', 'Sent study material', 'Follow-up on attendance', 'Query about batch timing', 'Payment confirmation', 'Doubt resolution', 'Exam preparation tips'][i % 8]}</td>
                  <td><span className={`badge ${i % 2 === 0 ? 'badge-success' : 'badge-accent'}`}>{i % 2 === 0 ? 'Replied' : 'Pending'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
