'use client'

import { useEffect, useRef } from 'react'
import { Chart } from 'chart.js'
import CountUp from '../CountUp'
import { CHART_THEME_COLORS, GREY_COLOR, GOLD_GRADIENT, EMERALD_GRADIENT } from '@/lib/constants'

interface DashboardTabProps {
  d: any
  escapeHTML: (str: string) => string
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function DashboardTab({ d, escapeHTML }: DashboardTabProps) {
  const sparkRevRef = useRef<HTMLCanvasElement>(null)
  const sparkStuRef = useRef<HTMLCanvasElement>(null)
  const sparkMsgRef = useRef<HTMLCanvasElement>(null)
  const sparkConvRef = useRef<HTMLCanvasElement>(null)
  const revTrendRef = useRef<HTMLCanvasElement>(null)
  const distRef = useRef<HTMLCanvasElement>(null)
  const msgBarRef = useRef<HTMLCanvasElement>(null)
  const courseRevRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const charts: Chart[] = []

    const makeSpark = (canvas: HTMLCanvasElement | null, data: number[], color: string) => {
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const chart = new Chart(ctx, {
        type: 'line',
        data: { labels: data.map((_, i) => i), datasets: [{ data, borderColor: color, fill: false, tension: 0.4, pointRadius: 0, borderWidth: 1.5 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } }, scales: { x: { display: false }, y: { display: false } } },
      })
      charts.push(chart)
    }

    if (d) {
      makeSpark(sparkRevRef.current, d.revMonthly || [], '#F0B429')
      makeSpark(sparkStuRef.current, d.stuMonthly || [], '#06B6D4')
      makeSpark(sparkMsgRef.current, d.msgMonthly || [], '#10B981')
      makeSpark(sparkConvRef.current, (d.stuMonthly || []).map((_: number, i: number) => 20 + Math.sin(i * 0.5) * 8 + i * 1.2), '#A855F7')

      // Revenue Trend
      if (revTrendRef.current) {
        const ctx = revTrendRef.current.getContext('2d')
        if (ctx) {
          const g = ctx.createLinearGradient(0, 0, 0, 280)
          g.addColorStop(0, GOLD_GRADIENT.top)
          g.addColorStop(1, GOLD_GRADIENT.bottom)
          const chart = new Chart(ctx, {
            type: 'line',
            data: {
              labels: MONTHS,
              datasets: [
                { label: 'This Year', data: d.revMonthly || [], borderColor: '#F0B429', backgroundColor: g, fill: true, tension: 0.4, pointRadius: 0, pointHoverRadius: 6, pointHoverBackgroundColor: '#F0B429', pointHoverBorderColor: '#08080D', pointHoverBorderWidth: 3, borderWidth: 2.5 },
                { label: 'Last Year', data: d.revPrev || [], borderColor: GREY_COLOR, borderDash: [6, 4], fill: false, tension: 0.4, pointRadius: 0, pointHoverRadius: 5, pointHoverBackgroundColor: GREY_COLOR, pointHoverBorderColor: '#08080D', pointHoverBorderWidth: 3, borderWidth: 1.5 }
              ]
            },
            options: { responsive: true, maintainAspectRatio: false, interaction: { intersect: false, mode: 'index' }, scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(42,42,58,0.3)' } } }, plugins: { legend: { display: false } } },
          })
          charts.push(chart)
        }
      }

      // Student Distribution
      if (distRef.current && d.dist) {
        const ctx = distRef.current.getContext('2d')
        if (ctx) {
          const distKeys = Object.keys(d.dist)
          const chart = new Chart(ctx, {
            type: 'doughnut',
            data: { labels: distKeys, datasets: [{ data: Object.values(d.dist) as number[], backgroundColor: CHART_THEME_COLORS.slice(0, distKeys.length), borderWidth: 0, hoverOffset: 8 }] },
            options: { responsive: true, maintainAspectRatio: false, cutout: '72%', plugins: { legend: { display: false } } },
          })
          charts.push(chart)
        }
      }

      // Messages Sent Bar
      if (msgBarRef.current) {
        const ctx = msgBarRef.current.getContext('2d')
        if (ctx) {
          const g = ctx.createLinearGradient(0, 0, 0, 230)
          g.addColorStop(0, 'rgba(16,185,129,0.8)')
          g.addColorStop(1, 'rgba(16,185,129,0.2)')
          const chart = new Chart(ctx, {
            type: 'bar',
            data: { labels: MONTHS, datasets: [{ label: 'Messages', data: d.msgMonthly || [], backgroundColor: g, borderRadius: 6, borderSkipped: false, barPercentage: 0.6 }] },
            options: { responsive: true, maintainAspectRatio: false, scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(42,42,58,0.3)' } } }, plugins: { legend: { display: false } } },
          })
          charts.push(chart)
        }
      }

      // Revenue by Course
      if (courseRevRef.current && d.courseRev) {
        const ctx = courseRevRef.current.getContext('2d')
        if (ctx) {
          const crKeys = Object.keys(d.courseRev).reverse()
          const chart = new Chart(ctx, {
            type: 'bar',
            data: { labels: crKeys, datasets: [{ data: crKeys.map(k => d.courseRev[k]), backgroundColor: crKeys.map((_, i) => CHART_THEME_COLORS[(crKeys.length - 1 - i) % CHART_THEME_COLORS.length] + '99'), borderRadius: 6, borderSkipped: false, barPercentage: 0.55 }] },
            options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, scales: { x: { grid: { color: 'rgba(42,42,58,0.3)' } }, y: { grid: { display: false } } }, plugins: { legend: { display: false } } },
          })
          charts.push(chart)
        }
      }
    }

    return () => {
      charts.forEach(c => c.destroy())
    }
  }, [d])

  if (!d) return <div style={{ color: 'var(--text-3)', padding: 24, textAlign: 'center' }}>Loading dashboard data...</div>

  const distKeys = Object.keys(d.dist || {})
  const totalDist = (Object.values(d.dist || {}) as number[]).reduce((acc, val) => acc + val, 0)

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 24 }}>
        {[
          { label: 'Revenue', icon: 'fa-solid fa-indian-rupee-sign', bg: 'var(--accent-dim)', color: 'var(--accent)', raw: d.kpi.revenue, chg: d.kpi.revChg, ref: sparkRevRef, fmt: (n: number) => '₹' + n.toLocaleString('en-IN') },
          { label: 'Students', icon: 'fa-solid fa-users', bg: 'var(--info-dim)', color: 'var(--info)', raw: d.kpi.students, chg: d.kpi.stuChg, ref: sparkStuRef, fmt: (n: number) => n.toLocaleString('en-IN') },
          { label: 'Messages Sent', icon: 'fa-solid fa-message', bg: 'var(--success-dim)', color: 'var(--success)', raw: d.kpi.messages, chg: d.kpi.msgChg, ref: sparkMsgRef, fmt: (n: number) => n.toLocaleString('en-IN') },
          { label: 'Conversion', icon: 'fa-solid fa-bullseye', bg: 'rgba(168,85,247,.12)', color: '#A855F7', raw: d.kpi.conversion, chg: d.kpi.convChg, ref: sparkConvRef, fmt: (n: number) => n + '%', suffix: '%' },
        ].map((kpi, i) => (
          <div key={i} className={`kpi-card stagger-in stagger-${i + 1}`}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-3)', margin: 0 }}>{kpi.label}</p>
              <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: kpi.bg }}>
                <i className={kpi.icon} style={{ color: kpi.color, fontSize: 13 }}></i>
              </div>
            </div>
            <p style={{ fontFamily: 'var(--font-space)', fontWeight: 700, fontSize: 24, margin: '0 0 4px', color: 'var(--text-1)' }}>
              <CountUp value={kpi.raw} formatter={kpi.fmt} />
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className={`badge ${kpi.chg >= 0 ? 'badge-success' : 'badge-danger'}`}>
                <i className={`fa-solid fa-chevron-${kpi.chg >= 0 ? 'up' : 'down'}`} style={{ fontSize: 9, marginRight: 2 }}></i> {Math.abs(kpi.chg)}%
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>vs last year</span>
            </div>
            <div className="sparkline-wrap"><canvas ref={kpi.ref} style={{ width: '100%', height: '100%' }} /></div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '8fr 4fr', gap: 20, marginBottom: 24 }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: 'var(--text-1)' }}>Revenue Trend</h3>
              <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '2px 0 0' }}>Monthly revenue vs previous year</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />This Year</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--text-3)', display: 'inline-block' }} />Last Year</span>
            </div>
          </div>
          <div className="chart-wrap" style={{ height: 280 }}><canvas ref={revTrendRef} /></div>
        </div>
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: 'var(--text-1)' }}>Student Distribution</h3>
          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 0 16px' }}>By course category</p>
          <div className="chart-wrap" style={{ height: 200 }}><canvas ref={distRef} /></div>
          <div style={{ marginTop: 16 }}>
            {distKeys.map((k, i) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: CHART_THEME_COLORS[i], display: 'inline-block' }} />
                  <span style={{ color: 'var(--text-2)' }}>{escapeHTML(k)}</span>
                </div>
                <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>{totalDist > 0 ? Math.round((d.dist[k] / totalDist) * 100) : 0}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: 'var(--text-1)' }}>Messages Sent</h3>
          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 0 20px' }}>Monthly message volume</p>
          <div className="chart-wrap" style={{ height: 230 }}><canvas ref={msgBarRef} /></div>
        </div>
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: 'var(--text-1)' }}>Revenue by Course</h3>
          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 0 20px' }}>Top earning courses</p>
          <div className="chart-wrap" style={{ height: 230 }}><canvas ref={courseRevRef} /></div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 16px 0', color: 'var(--text-1)' }}>Recent Activity</h3>
        {(d.activities || []).map((a: any, i: number) => (
          <div key={i} className="activity-item">
            <div className="activity-dot" style={{ background: a.color }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, color: 'var(--text-1)', margin: 0 }}>{a.text}</p>
              <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '2px 0 0' }}>{a.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
