'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/client'

const empty = { name: '', subject: '', schedule: '', capacity: 30, teacherId: '' }

export default function BatchesPage() {
  const [batches, setBatches] = useState<any[] | null>(null)
  const [teachers, setTeachers] = useState<any[]>([])
  const [form, setForm] = useState(empty)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [me, setMe] = useState<any>(null)

  const load = (q = search) => api(`/api/batches?search=${encodeURIComponent(q)}`).then(setBatches).catch((e) => setError(e.message))
  
  useEffect(() => {
    const t = setTimeout(() => load(search), 250)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  useEffect(() => {
    api('/api/auth/me').then(setMe).catch(() => {})
    api('/api/teachers').then(setTeachers).catch(() => {})
  }, [])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api('/api/batches', {
        method: 'POST',
        body: JSON.stringify({ ...form, capacity: Number(form.capacity), teacherId: form.teacherId || undefined }),
      })
      setForm(empty)
      await load()
    } catch (err: any) { setError(err.message) }
    setBusy(false)
  }

  async function remove(id: string) {
    if (!confirm('Delete this batch? Attendance and exams in it will be removed.')) return
    try { await api(`/api/batches/${id}`, { method: 'DELETE' }); await load() } catch (err: any) { setError(err.message) }
  }

  async function sendAlerts(b: any) {
    const institute = await api('/api/stats') 
    if (institute.plan !== 'PRO') {
      alert('⚠️ Feature Locked: Upgrade to PRO to send WhatsApp alerts to parents!')
      return
    }
    
    // Call the newly integrated bulk sender
    try {
      const res = await api('/api/notifications/send', { method: 'POST' })
      alert(`📢 ${res.message}`)
    } catch (err: any) {
      alert(err.message)
    }
  }

  const set = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value })
  const isAdmin = me?.role === 'INSTITUTE_ADMIN'

  return (
    <>
      <h1>Batches</h1>
      <div className="card">
        <div className="toolbar">
          <div style={{ flex: 1 }}>
            <label>Search</label>
            <input
              placeholder="Search batches by name or subject…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>
      {isAdmin && (
        <div className="card">
          <h2>Create batch</h2>
          <form className="row" onSubmit={add}>
            <div><label>Name</label><input value={form.name} onChange={set('name')} required /></div>
            <div><label>Subject</label><input value={form.subject} onChange={set('subject')} required /></div>
            <div><label>Schedule</label><input value={form.schedule} onChange={set('schedule')} placeholder="Mon/Wed/Fri 17:00-18:30" required /></div>
            <div><label>Capacity</label><input type="number" min={1} value={form.capacity} onChange={set('capacity')} required /></div>
            <div>
              <label>Teacher</label>
              <select value={form.teacherId} onChange={set('teacherId')}>
                <option value="">Unassigned</option>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.user.name}</option>)}
              </select>
            </div>
            <button className="btn" disabled={busy}>{busy ? 'Creating…' : 'Create batch'}</button>
          </form>
          {error && <p className="error">{error}</p>}
        </div>
      )}
      <div className="grid cols-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
        {!batches
          ? [1, 2, 3].map((i) => <div key={i} className="card"><div className="skeleton" style={{ height: 110 }} /></div>)
          : batches.map((b) => {
              const fill = Math.min(100, Math.round((b._count.students / b.capacity) * 100))
              return (
                <div key={b.id} className="card hoverable">
                  <h2 style={{ marginBottom: 4 }}>{b.name}</h2>
                  <p className="muted">{b.subject} · {b.schedule}</p>
                  <p className="muted" style={{ margin: '8px 0' }}>
                    👨‍🏫 {b.teacher ? b.teacher.user.name : 'Unassigned'}
                  </p>
                  <p className="muted" style={{ fontSize: 13, marginBottom: 8 }}>
                    🔑 Code: <strong style={{ color: '#10b981' }}>{b.joinCode || 'N/A'}</strong>
                  </p>
                  <div className="bar" title={`${b._count.students}/${b.capacity} enrolled`}>
                    <span style={{ width: `${fill}%` }} />
                  </div>
                  <p className="muted" style={{ marginTop: 6 }}>{b._count.students}/{b.capacity} students</p>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button className="btn outline sm" style={{ flex: 1 }} onClick={() => sendAlerts(b)}>
                      📢 Send Alerts
                    </button>
                    {isAdmin && (
                      <button className="btn danger sm" onClick={() => remove(b.id)}>Delete</button>
                    )}
                  </div>
                </div>
              )
            })}
        {batches && batches.length === 0 && <p className="muted">No batches yet.</p>}
      </div>
    </>
  )
}
