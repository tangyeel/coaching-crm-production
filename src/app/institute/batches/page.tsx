'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/client'
import { CL } from '@/lib/portal-mock-data'
import { useToast } from '@/components/Toast'

interface Teacher {
  id: string
  name: string
}

interface Batch {
  id: string
  name: string
  subject: string
  schedule: string
  capacity: number
  join_code: string
  teacher_id: string | null
  teacher: { user: { name: string } } | null
  _count?: { students: number }
}

export default function InstituteBatchesPage() {
  const { toast } = useToast()
  const [batches, setBatches] = useState<Batch[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [busy, setBusy] = useState(false)
  const [search, setSearch] = useState('')

  const [form, setForm] = useState({ name: '', subject: 'JEE Advanced', capacity: 40, teacherId: '', schedule: '' })

  const load = () => {
    setLoading(true)
    Promise.all([
      api('/api/batches'),
      api('/api/teachers')
    ]).then(([batchesData, teachersData]) => {
      setBatches(batchesData)
      setTeachers(teachersData)
      if (teachersData.length > 0) {
        setForm(f => ({ ...f, teacherId: teachersData[0].id }))
      }
    })
    .catch(err => toast(err.message, 'err'))
    .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const create = async () => {
    if (!form.name.trim()) { toast('Enter name', 'err'); return }
    if (!form.subject.trim()) { toast('Enter subject', 'err'); return }

    setBusy(true)
    try {
      await api('/api/batches', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          subject: form.subject,
          schedule: form.schedule,
          capacity: Number(form.capacity),
          teacherId: form.teacherId || undefined
        })
      })
      toast(`"${form.name}" created`)
      setModal(false)
      setForm({ name: '', subject: 'JEE Advanced', capacity: 40, teacherId: teachers[0]?.id || '', schedule: '' })
      load()
    } catch (err: any) {
      toast(err.message, 'err')
    } finally {
      setBusy(false)
    }
  }

  const removeBatch = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return
    try {
      await api(`/api/batches/${id}`, { method: 'DELETE' })
      toast('Deleted', 'err')
      load()
    } catch (err: any) {
      toast(err.message, 'err')
    }
  }

  const filtered = batches.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.subject.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="si si-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div className="sb">
          <i className="fa-solid fa-magnifying-glass" style={{ fontSize: 11, color: 'var(--t3)' }} />
          <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}><i className="fa-solid fa-plus" style={{ marginRight: 6 }} />Create</button>
      </div>

      {loading ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--t3)' }}>Loading batches...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {filtered.map((b, idx) => {
            const enr = b._count?.students || 0
            const pct = Math.round(enr / b.capacity * 100)
            const col = CL[idx % 5]
            const pctColor = pct > 90 ? 'var(--err)' : pct > 70 ? 'var(--acc)' : 'var(--ok)'
            return (
              <div key={b.id} className={'card si si-' + ((idx % 6) + 1)}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <h4 className="font-display" style={{ fontWeight: 600, fontSize: 14, color: 'var(--t1)', margin: 0 }}>{b.name}</h4>
                    <p style={{ fontSize: 11, marginTop: 2, color: 'var(--t3)' }}>{b.subject} — {b.schedule || 'No schedule'}</p>
                  </div>
                  <span className="badge b-inf">{b.join_code}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, background: col + '22', color: col }}>
                    <i className="fa-solid fa-user-tie" />
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--t1)', margin: 0 }}>
                    {b.teacher?.user?.name || 'Unassigned'}
                  </p>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                    <span style={{ color: 'var(--t2)' }}>{enr}/{b.capacity}</span>
                    <span style={{ color: pctColor, fontWeight: 600 }}>{pct}%</span>
                  </div>
                  <div className="cb"><div className="cf" style={{ width: pct + '%', background: col }} /></div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={() => removeBatch(b.id, b.name)}><i className="fa-solid fa-trash" style={{ marginRight: 6 }} />Delete</button>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div style={{ gridColumn: 'span 2', textAlign: 'center', color: 'var(--t3)', padding: 32 }}>No batches found</div>
          )}
        </div>
      )}

      <div className={'mo' + (modal ? ' open' : '')}>
        <div className="mo-bd" onClick={() => setModal(false)} />
        <div className="mo-box">
          <h3 className="font-display" style={{ fontWeight: 600, fontSize: 18, marginBottom: 20, color: 'var(--t1)' }}>Create Batch</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div><label className="fl">Name</label><input className="fi" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="fl">Subject / Course</label>
                <input className="fi" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} />
              </div>
              <div><label className="fl">Capacity</label><input className="fi" type="number" value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: Number(e.target.value) }))} /></div>
            </div>
            <div>
              <label className="fl">Teacher</label>
              <select className="fi" value={form.teacherId} onChange={e => setForm(p => ({ ...p, teacherId: e.target.value }))}>
                <option value="">Select Teacher (Optional)</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div><label className="fl">Schedule</label><input className="fi" placeholder="Mon/Wed/Fri 4-6 PM" value={form.schedule} onChange={e => setForm(p => ({ ...p, schedule: e.target.value }))} /></div>
            <button className="btn btn-primary w-full" disabled={busy} onClick={create}>{busy ? 'Creating...' : 'Create'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

