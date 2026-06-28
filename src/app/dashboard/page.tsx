'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/client'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts'
import CountUp from '@/components/CountUp'
import PageTransition from '@/components/PageTransition'

export default function Overview() {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    api('/api/stats').then(setStats).catch(() => {})
  }, [])

  if (!stats) {
    return (
      <PageTransition>
        <h1>Overview</h1>
        <div className="grid cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card"><div className="skeleton" style={{ height: 56 }} /></div>
          ))}
        </div>
        <div className="card" style={{ marginTop: 22 }}><div className="skeleton" style={{ height: 200 }} /></div>
      </PageTransition>
    )
  }

  const cards = [
    { label: 'Students', value: stats.students },
    { label: 'Teachers', value: stats.teachers },
    { label: 'Batches', value: stats.batches },
    { label: 'Present today', value: stats.presentToday },
  ]

  return (
    <PageTransition>
      <h1>Overview</h1>
      <div className="grid cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card hoverable">
            <div className="stat">
              <CountUp value={c.value} />
            </div>
            <div className="muted">{c.label}</div>
          </div>
        ))}
      </div>
...
      {stats.trend && (
        <div className="card chart-card" style={{ marginTop: 22 }}>
          <h2>📊 Attendance · last 7 days</h2>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <AreaChart data={stats.trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gLate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gAbsent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="present" name="Present" stroke="#10b981" strokeWidth={2.5} fill="url(#gPresent)" isAnimationActive animationDuration={800} animationEasing="ease-in-out" />
                <Area type="monotone" dataKey="late" name="Late" stroke="#f59e0b" strokeWidth={2} fill="url(#gLate)" isAnimationActive animationDuration={1000} animationEasing="ease-in-out" />
                <Area type="monotone" dataKey="absent" name="Absent" stroke="#ef4444" strokeWidth={2} fill="url(#gAbsent)" isAnimationActive animationDuration={1200} animationEasing="ease-in-out" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 22 }}>
        <h2>📢 Latest announcements</h2>
        {stats.announcements.length === 0 && <p className="muted">No announcements yet.</p>}
        {stats.announcements.map((a: any) => (
          <div key={a.id} className="announce">
            <strong>{a.title}</strong>{' '}
            {a.batch && <span className="badge indigo">{a.batch.name}</span>}{' '}
            <span className="muted">{new Date(a.createdAt).toLocaleString()}</span>
            <p className="muted" style={{ marginTop: 4 }}>{a.body}</p>
          </div>
        ))}
      </div>
    </PageTransition>
  )
}
