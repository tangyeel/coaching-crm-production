'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/client'

const empty = { name: '', email: '', password: '', phone: '', subject: '' }

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<any[] | null>(null)
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => api('/api/teachers').then(setTeachers).catch((e) => setError(e.message))
  useEffect(() => { load() }, [])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api('/api/teachers', { method: 'POST', body: JSON.stringify({ ...form, phone: form.phone || undefined, subject: form.subject || undefined }) })
      setForm(empty)
      await load()
    } catch (err: any) { setError(err.message) }
    setBusy(false)
  }

  async function remove(id: string) {
    if (!confirm('Remove this teacher?')) return
    try { await api(`/api/teachers/${id}`, { method: 'DELETE' }); await load() } catch (err: any) { setError(err.message) }
  }

  async function resetPassword(email: string) {
    const pw = prompt(`New password for ${email} (min 6 characters):`)
    if (!pw) return
    try {
      await api('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, newPassword: pw }) })
      alert('Password reset \u2713')
    } catch (err: any) { setError(err.message) }
  }

  const set = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value })

  return (
    <>
      <h1>Teachers</h1>
      <div className="card">
        <h2>Add teacher</h2>
        <form className="row" onSubmit={add}>
          <div><label>Name</label><input value={form.name} onChange={set('name')} required /></div>
          <div><label>Email</label><input type="email" value={form.email} onChange={set('email')} required /></div>
          <div><label>Password</label><input type="password" value={form.password} onChange={set('password')} minLength={6} required /></div>
          <div><label>Phone</label><input value={form.phone} onChange={set('phone')} /></div>
          <div><label>Subject</label><input value={form.subject} onChange={set('subject')} /></div>
          <button className="btn" disabled={busy}>{busy ? 'Adding…' : 'Add teacher'}</button>
        </form>
        {error && <p className="error">{error}</p>}
      </div>
      <div className="card">
        {!teachers ? (
          <div className="skeleton" style={{ height: 140 }} />
        ) : teachers.length === 0 ? (
          <p className="muted">No teachers yet. Add your first teacher above.</p>
        ) : (
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Subject</th><th>Batches</th><th /></tr></thead>
            <tbody>
              {teachers.map((t) => (
                <tr key={t.id}>
                  <td><strong>{t.user.name}</strong></td>
                  <td>{t.user.email}</td>
                  <td>{t.user.phone || '-'}</td>
                  <td>{t.subject ? <span className="badge indigo">{t.subject}</span> : '-'}</td>
                  <td>{t._count.batches}</td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button className="btn outline sm" style={{ marginRight: 8 }} onClick={() => resetPassword(t.user.email)}>Reset password</button>
                    <button className="btn danger sm" onClick={() => remove(t.id)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
