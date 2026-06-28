'use client'

import { useEffect, useRef } from 'react'
import { Chart } from 'chart.js'
import CountUp from '../CountUp'
import { CHART_THEME_COLORS, GREY_COLOR, GOLD_GRADIENT } from '@/lib/constants'

interface RevenueTabProps {
  d: any
  escapeHTML: (str: string) => string
  money: (n: number) => string
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function RevenueTab({ d, escapeHTML, money }: RevenueTabProps) {
  const revCompareRef = useRef<HTMLCanvasElement>(null)
  const revCourseRef = useRef<HTMLCanvasElement>(null)
  const payMethodsRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const charts: Chart[] = []

    if (d) {
      // Revenue Compare Line Chart
      if (revCompareRef.current) {
        const ctx = revCompareRef.current.getContext('2d')
        if (ctx) {
          const g = ctx.createLinearGradient(0, 0, 0, 300)
          g.addColorStop(0, GOLD_GRADIENT.top)
          g.addColorStop(1, GOLD_GRADIENT.bottom)
          const chart = new Chart(ctx, {
            type: 'line',
            data: {
              labels: MONTHS,
              datasets: [
                { label: '2024', data: d.revMonthly || [], borderColor: '#F0B429', backgroundColor: g, fill: true, tension: 0.4, pointRadius: 0, pointHoverRadius: 6, pointHoverBackgroundColor: '#F0B429', pointHoverBorderColor: '#08080D', pointHoverBorderWidth: 3, borderWidth: 2.5 },
                { label: '2023', data: d.revPrev || [], borderColor: GREY_COLOR, borderDash: [6, 4], fill: false, tension: 0.4, pointRadius: 0, pointHoverRadius: 5, pointHoverBackgroundColor: GREY_COLOR, pointHoverBorderColor: '#08080D', pointHoverBorderWidth: 3, borderWidth: 1.5 }
              ]
            },
            options: { responsive: true, maintainAspectRatio: false, interaction: { intersect: false, mode: 'index' }, scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(42,42,58,0.3)' } } }, plugins: { legend: { display: false } } },
          })
          charts.push(chart)
        }
      }

      // Course-wise Revenue
      if (revCourseRef.current && d.courseRev) {
        const ctx = revCourseRef.current.getContext('2d')
        if (ctx) {
          const crKeys = Object.keys(d.courseRev)
          const chart = new Chart(ctx, {
            type: 'bar',
            data: {
              labels: crKeys,
              datasets: [{
                label: 'Revenue',
                data: crKeys.map(k => d.courseRev[k]),
                backgroundColor: CHART_THEME_COLORS.slice(0, crKeys.length).map(c => c + 'CC'),
                borderRadius: 6,
                barPercentage: 0.6
              }]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(42,42,58,0.3)' } } }, plugins: { legend: { display: false } } },
          })
          charts.push(chart)
        }
      }

      // Payment Methods Doughnut
      if (payMethodsRef.current && d.payMethods) {
        const ctx = payMethodsRef.current.getContext('2d')
        if (ctx) {
          const pmKeys = Object.keys(d.payMethods)
          const chart = new Chart(ctx, {
            type: 'doughnut',
            data: { labels: pmKeys, datasets: [{ data: pmKeys.map(k => d.payMethods[k]), backgroundColor: CHART_THEME_COLORS.slice(0, pmKeys.length), borderWidth: 0, hoverOffset: 6 }] },
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

  if (!d) return <div style={{ color: 'var(--text-3)', padding: 24, textAlign: 'center' }}>Loading revenue data...</div>

  const pmKeys = Object.keys(d.payMethods || {})
  const pmTotal = (Object.values(d.payMethods || {}) as number[]).reduce((a, b) => a + b, 0)

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 24 }}>
        {[
          { label: 'Total Revenue', raw: d.kpi.revenue, chg: d.kpi.revChg, icon: 'fa-solid fa-indian-rupee-sign', bg: 'var(--accent-dim)', c: 'var(--accent)', fmt: (n: number) => '₹' + n.toLocaleString('en-IN') },
          { label: 'Monthly Recurring', raw: d.mrr, sub: 'Per month average', icon: 'fa-solid fa-arrows-rotate', bg: 'var(--info-dim)', c: 'var(--info)', fmt: (n: number) => '₹' + n.toLocaleString('en-IN') },
          { label: 'Revenue / Student', raw: d.arpu, sub: 'Average per student', icon: 'fa-solid fa-tag', bg: 'var(--success-dim)', c: 'var(--success)', fmt: (n: number) => '₹' + n.toLocaleString('en-IN') },
          { label: 'Collection Rate', raw: d.collRate, suffix: '%', sub: `Response rate: ${d.respRate}%`, icon: 'fa-solid fa-chart-simple', bg: 'rgba(168,85,247,.12)', c: '#A855F7', fmt: (n: number) => n + '%' },
        ].map((kpi, i) => (
          <div key={i} className={`kpi-card stagger-in stagger-${i + 1}`}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-3)', margin: 0 }}>{kpi.label}</p>
              <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: kpi.bg }}>
                <i className={kpi.icon} style={{ color: kpi.c, fontSize: 13 }}></i>
              </div>
            </div>
            <p style={{ fontFamily: 'var(--font-space)', fontWeight: 700, fontSize: 24, margin: '0 0 4px', color: 'var(--text-1)' }}>
              <CountUp value={kpi.raw} formatter={kpi.fmt} />
            </p>
            {kpi.chg != null ? <span className={`badge ${kpi.chg >= 0 ? 'badge-success' : 'badge-danger'}`}><i className={`fa-solid fa-chevron-${kpi.chg >= 0 ? 'up' : 'down'}`} style={{ fontSize: 9, marginRight: 2 }}></i> {Math.abs(kpi.chg)}%</span> : <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{kpi.sub}</span>}
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: 'var(--text-1)' }}>Revenue Comparison</h3>
            <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '2px 0 0' }}>Year-over-year monthly revenue</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />2024</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--text-3)', display: 'inline-block' }} />2023</span>
          </div>
        </div>
        <div className="chart-wrap" style={{ height: 300 }}><canvas ref={revCompareRef} /></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 20 }}>
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: 'var(--text-1)' }}>Course-wise Revenue</h3>
          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 0 20px' }}>Breakdown by course category</p>
          <div className="chart-wrap" style={{ height: 260 }}><canvas ref={revCourseRef} /></div>
        </div>
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: 'var(--text-1)' }}>Payment Methods</h3>
          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 0 20px' }}>How students pay</p>
          <div className="chart-wrap" style={{ height: 200 }}><canvas ref={payMethodsRef} /></div>
          <div style={{ marginTop: 16 }}>
            {pmKeys.map((k, i) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: CHART_THEME_COLORS[i], display: 'inline-block' }} />
                  <span style={{ color: 'var(--text-2)' }}>{escapeHTML(k)}</span>
                </div>
                <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>{pmTotal > 0 ? Math.round((d.payMethods[k] / pmTotal) * 100) : 0}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
