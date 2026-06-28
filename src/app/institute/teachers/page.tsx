'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/client'
import { getInitials } from '@/lib/portal-mock-data'
import { useToast } from '@/components/Toast'

interface Teacher {
  id: string
  name: string
  email: string
  phone: string | null
  subject: string | null
  _count?: { batches: number }
}

export default function InstituteTeachersPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', password: 'teacher123' })

  const load = () => {
    setLoading(true)
    api('/api/teachers')
      .then(setTeachers)
      .catch(err => toast(err.message, 'err'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    api('/api/auth/me')
      .then(res => {
        if (res.role === 'TEACHER') {
          router.replace('/institute')
        } else {
          load()
        }
      })
      .catch(() => {
        router.replace('/login')
      })
  }, [])

  const addTeacher = async () => {
    if (!form.name.trim()) { toast('Enter name', 'err'); return }
    if (!form.email.trim()) { toast('Enter email', 'err'); return }
    if (form.password.length < 6) { toast('Password must be at least 6 characters', 'err'); return }

    setBusy(true)
    try {
      const newTeacher = await api('/api/teachers', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          subject: form.subject || undefined,
          password: form.password,
        })
      })
      toast(`${newTeacher.name} added successfully`)
      setModal(false)
      setForm({ name: '', email: '', phone: '', subject: '', password: 'teacher123' })
      load()
    } catch (err: any) {
      toast(err.message, 'err')
    } finally {
      setBusy(false)
    }
  }

  const removeTeacher = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to deactivate ${name}?`)) return
    try {
      await api(`/api/teachers/${id}`, { method: 'DELETE' })
      toast(`${name} deactivated`, 'ok')
      load()
    } catch (err: any) {
      toast(err.message, 'err')
    }
  }

  return (
    <div>
      <div className="si si-1" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}><i className="fa-solid fa-plus" style={{ marginRight: 6 }} />Add Teacher</button>
      </div>

      <div className="card si si-2" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--t3)' }}>Loading teachers...</div>
        ) : (
          <table className="dt">
            <thead><tr><th>Teacher</th><th>Subject</th><th>Batches Count</th><th>Phone</th><th>Actions</th></tr></thead>
            <tbody>
              {teachers.map((t, i) => {
                const av = getInitials(t.name, i)
                return (
                  <tr key={t.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, background: av.bg, color: av.color }}>{av.initials}</div>
                        <div><p style={{ color: 'var(--t1)', fontWeight: 500, margin: 0 }}>{t.name}</p><p style={{ fontSize: 11, color: 'var(--t3)', margin: 0 }}>{t.email}</p></div>
                      </div>
                    </td>
                    <td><span className="badge b-inf">{t.subject || 'General'}</span></td>
                    <td><span style={{ fontFamily: 'monospace', fontSize: 12, padding: '2px 8px', borderRadius: 6, background: 'var(--bg2)' }}>{t._count?.batches || 0} batches</span></td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{t.phone || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-danger btn-sm" onClick={() => removeTeacher(t.id, t.name)}><i className="fa-solid fa-trash" style={{ fontSize: 10 }} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {teachers.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--t3)', padding: 32 }}>No teachers found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className={'mo' + (modal ? ' open' : '')}>
        <div className="mo-bd" onClick={() => setModal(false)} />
        <div className="mo-box">
          <h3 className="font-display" style={{ fontWeight: 600, fontSize: 18, marginBottom: 20, color: 'var(--t1)' }}>Add Teacher</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div><label className="fl">Name</label><input className="fi" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label className="fl">Email</label><input className="fi" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
              <div><label className="fl">Phone</label><input className="fi" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label className="fl">Subject</label><input className="fi" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} /></div>
              <div><label className="fl">Password</label><input className="fi" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} /></div>
            </div>
            <button className="btn btn-primary w-full" disabled={busy} onClick={addTeacher}>{busy ? 'Adding...' : 'Add'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

