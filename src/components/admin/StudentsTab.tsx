'use client'

import { useState } from 'react'
import CountUp from '../CountUp'

interface Student {
  id: string
  name: string
  course: string
  batch: string
  phone: string
  joined: string
  lastActive: string
  status: string
}

interface StudentsTabProps {
  students: Student[]
  activeCount: number
  inactiveCount: number
  totalStudentsKPI: number
  totalStudentsKPIChg: number | null
  escapeHTML: (str: string) => string
}

export default function StudentsTab({
  students,
  activeCount,
  inactiveCount,
  totalStudentsKPI,
  totalStudentsKPIChg,
  escapeHTML,
}: StudentsTabProps) {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  // React state filtering instead of direct DOM innerHTML overrides!
  const filtered = students.filter(s => {
    const matchesFilter = filter === 'all' || s.status === filter
    const matchesSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.course && s.course.toLowerCase().includes(search.toLowerCase())) ||
      (s.batch && s.batch.toLowerCase().includes(search.toLowerCase()))
    return matchesFilter && matchesSearch
  })

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 24 }}>
        {[
          { label: 'Total Students', raw: totalStudentsKPI, chg: totalStudentsKPIChg, sub: 'Registered database profiles', icon: 'fa-solid fa-users', bg: 'var(--info-dim)', c: 'var(--info)', fmt: (n: number) => n.toLocaleString('en-IN') },
          { label: 'Active', raw: activeCount, sub: 'Currently enrolled', icon: 'fa-solid fa-check', bg: 'var(--success-dim)', c: 'var(--success)', fmt: (n: number) => String(n) },
          { label: 'Inactive', raw: inactiveCount, sub: 'Inactive student profiles', icon: 'fa-solid fa-xmark', bg: 'var(--danger-dim)', c: 'var(--danger)', fmt: (n: number) => String(n) },
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
            {kpi.chg != null ? (
              <span className={`badge ${kpi.chg >= 0 ? 'badge-success' : 'badge-danger'}`}>
                <i className={`fa-solid fa-chevron-${kpi.chg >= 0 ? 'up' : 'down'}`} style={{ fontSize: 9, marginRight: 2 }}></i> {Math.abs(kpi.chg)}%
              </span>
            ) : (
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{kpi.sub}</span>
            )}
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: 'var(--text-1)' }}>Student Directory</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div className="search-box small">
              <i className="fa-solid fa-magnifying-glass" style={{ color: 'var(--text-3)', fontSize: 11 }}></i>
              <input
                type="text"
                placeholder="Search students..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ fontSize: 13 }}
              />
            </div>
            <div className="filter-tabs">
              {['all', 'active', 'inactive'].map(f => (
                <div
                  key={f}
                  className={`filter-tab ${filter === f ? 'active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th>Batch</th>
                <th>Phone</th>
                <th>Joined</th>
                <th>Last Active</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--text-3)' }}>
                    No students found.
                  </td>
                </tr>
              ) : (
                filtered.map(student => (
                  <tr key={student.id}>
                    <td>
                      <span style={{ color: 'var(--text-1)', fontWeight: 500 }}>
                        {escapeHTML(student.name)}
                      </span>
                    </td>
                    <td>{escapeHTML(student.course || 'General')}</td>
                    <td>{escapeHTML(student.batch || 'None')}</td>
                    <td>{escapeHTML(student.phone)}</td>
                    <td style={{ fontFamily: 'var(--font-space)' }}>{student.joined}</td>
                    <td>{escapeHTML(student.lastActive)}</td>
                    <td>
                      <span className={`badge ${student.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                        {student.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
