'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/client'
import { getInitials } from '@/lib/portal-mock-data'
import { useToast } from '@/components/Toast'

interface Batch {
  id: string
  name: string
}

interface Student {
  id: string
  name: string
  email: string
  phone: string | null
  fee_status: string
  created_at: string
  enrollments?: { batch: { id: string; name: string; subject: string } | null }[]
}

export default function InstituteStudentsPage() {
  const { toast } = useToast()
  const [students, setStudents] = useState<Student[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [busy, setBusy] = useState(false)
  const [logModal, setLogModal] = useState(false)
  const [selectedStudentLogs, setSelectedStudentLogs] = useState<any>(null)
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [activeTab, setActiveTab] = useState<'attendance' | 'marks'>('attendance')

  const [form, setForm] = useState({ name: '', email: '', phone: '', batchId: '', password: 'student123' })
  const perPage = 10

  const load = () => {
    setLoading(true)
    api(`/api/students?page=${page}&perPage=${perPage}&search=${search}`)
      .then(res => {
        setStudents(res.items)
        setTotal(res.total)
      })
      .catch(err => toast(err.message, 'err'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [page, search])

  useEffect(() => {
    api('/api/batches')
      .then(res => {
        setBatches(res)
        if (res.length > 0) {
          setForm(f => ({ ...f, batchId: res[0].id }))
        }
      })
      .catch(err => toast(err.message, 'err'))
  }, [])

  const toggleFee = async (id: string, current: string) => {
    const nextStatus = current === 'PAID' ? 'DUE' : 'PAID'
    try {
      await api(`/api/students/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ feeStatus: nextStatus })
      })
      toast('Fee status updated')
      load()
    } catch (err: any) {
      toast(err.message, 'err')
    }
  }

  const remove = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to deactivate ${name}?`)) return
    try {
      await api(`/api/students/${id}`, { method: 'DELETE' })
      toast(`${name} removed`, 'err')
      load()
    } catch (err: any) {
      toast(err.message, 'err')
    }
  }

  const showLogs = async (student: Student) => {
    setLoadingLogs(true)
    setSelectedStudentLogs({ name: student.name, attendance: [], marks: [] })
    setLogModal(true)
    try {
      const res = await api(`/api/students/${student.id}`)
      setSelectedStudentLogs(res)
    } catch (err: any) {
      toast(err.message, 'err')
    } finally {
      setLoadingLogs(false)
    }
  }

  const addStudent = async () => {
    if (!form.name.trim()) { toast('Enter name', 'err'); return }
    if (!form.email.trim()) { toast('Enter email', 'err'); return }
    if (form.password.length < 6) { toast('Password must be at least 6 characters', 'err'); return }

    setBusy(true)
    try {
      await api('/api/students', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          password: form.password,
          batchIds: form.batchId ? [form.batchId] : []
        })
      })
      toast(`${form.name} added successfully`)
      setModal(false)
      setForm({ name: '', email: '', phone: '', batchId: batches[0]?.id || '', password: 'student123' })
      load()
    } catch (err: any) {
      toast(err.message, 'err')
    } finally {
      setBusy(false)
    }
  }

  const pages = Math.ceil(total / perPage) || 1

  return (
    <div>
      <div className="si si-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="sb">
            <i className="fa-solid fa-magnifying-glass" style={{ fontSize: 11, color: 'var(--t3)' }} />
            <input placeholder="Search..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}><i className="fa-solid fa-plus" style={{ marginRight: 6 }} />Add Student</button>
        </div>
      </div>

      <div className="card si si-2" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--t3)' }}>Loading students...</div>
        ) : (
          <table className="dt">
            <thead><tr>
              <th>Student</th><th>Batch</th><th>Fee</th><th>Joined</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {students.map((s, i) => {
                const av = getInitials(s.name, i)
                const enrollments = s.enrollments || []
                const batchNames = enrollments.map(e => e.batch?.name).filter(Boolean).join(', ') || 'None'
                const isPaid = s.fee_status === 'PAID'
                return (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, background: av.bg, color: av.color }}>{av.initials}</div>
                        <div><p style={{ color: 'var(--t1)', fontWeight: 500, margin: 0 }}>{s.name}</p><p style={{ fontSize: 11, color: 'var(--t3)', margin: 0 }}>{s.email}</p></div>
                      </div>
                    </td>
                    <td><span style={{ fontFamily: 'monospace', fontSize: 12, padding: '2px 8px', borderRadius: 6, background: 'var(--bg2)' }}>{batchNames}</span></td>
                    <td>
                      <span className={'badge ' + (isPaid ? 'b-ok' : 'b-err')}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                        {isPaid ? 'Paid' : 'Due'}
                      </span>
                    </td>
                    <td style={{ fontSize: 12 }}>{new Date(s.created_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" title="View Logs" onClick={() => showLogs(s)}><i className="fa-solid fa-chart-simple" style={{ fontSize: 10 }} /></button>
                        <button className="btn btn-ghost btn-sm" onClick={() => toggleFee(s.id, s.fee_status)}><i className="fa-solid fa-indian-rupee-sign" style={{ fontSize: 10 }} /></button>
                        <button className="btn btn-danger btn-sm" onClick={() => remove(s.id, s.name)}><i className="fa-solid fa-trash" style={{ fontSize: 10 }} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {students.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--t3)', padding: 32 }}>No students found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="si si-3" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
        <p style={{ fontSize: 12, color: 'var(--t3)' }}>{(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total}</p>
        <div style={{ display: 'flex', gap: 4 }}>
          {Array.from({ length: pages }, (_, i) => (
            <button key={i} className={'btn btn-sm ' + (i + 1 === page ? 'btn-primary' : 'btn-ghost')} style={{ minWidth: 32 }} onClick={() => setPage(i + 1)}>{i + 1}</button>
          ))}
        </div>
      </div>

      {/* Modal */}
      {/* Add Student Modal */}
      <div className={'mo' + (modal ? ' open' : '')}>
        <div className="mo-bd" onClick={() => setModal(false)} />
        <div className="mo-box">
          <h3 className="font-display" style={{ fontWeight: 600, fontSize: 18, marginBottom: 20, color: 'var(--t1)' }}>Add Student</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label className="fl">Name</label><input className="fi" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div><label className="fl">Email</label><input className="fi" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label className="fl">Phone</label><input className="fi" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
              <div>
                <label className="fl">Batch</label>
                <select className="fi" value={form.batchId} onChange={e => setForm(p => ({ ...p, batchId: e.target.value }))}>
                  {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="fl">Password</label>
              <input className="fi" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
            </div>
            <button className="btn btn-primary w-full" disabled={busy} onClick={addStudent}>{busy ? 'Adding...' : 'Add'}</button>
          </div>
        </div>
      </div>

      {/* Log Modal */}
      <div className={'mo' + (logModal ? ' open' : '')}>
        <div className="mo-bd" onClick={() => { setLogModal(false); setSelectedStudentLogs(null); }} />
        <div className="mo-box" style={{ maxWidth: 640 }}>
          <h3 className="font-display" style={{ fontWeight: 600, fontSize: 18, marginBottom: 20, color: 'var(--t1)' }}>
            Logs for {selectedStudentLogs?.name}
          </h3>
          
          <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid var(--bdr)', marginBottom: 16 }}>
            <button 
              className={'btn btn-sm ' + (activeTab === 'attendance' ? 'btn-primary' : 'btn-ghost')}
              style={{ padding: '6px 12px', fontSize: 12 }}
              onClick={() => setActiveTab('attendance')}
            >
              Attendance Log
            </button>
            <button 
              className={'btn btn-sm ' + (activeTab === 'marks' ? 'btn-primary' : 'btn-ghost')}
              style={{ padding: '6px 12px', fontSize: 12 }}
              onClick={() => setActiveTab('marks')}
            >
              Marks Log
            </button>
          </div>

          {loadingLogs ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--t3)' }}>Loading history...</div>
          ) : (
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              {activeTab === 'attendance' ? (
                <table className="dt">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Batch</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedStudentLogs?.attendance ?? []).map((att: any, idx: number) => (
                      <tr key={idx}>
                        <td>{new Date(att.date).toLocaleDateString()}</td>
                        <td>{att.batch?.name || 'General'}</td>
                        <td>
                          <span className={'badge ' + (att.status === 'PRESENT' ? 'b-ok' : att.status === 'LATE' ? 'b-inf' : 'b-err')}>
                            {att.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {(selectedStudentLogs?.attendance ?? []).length === 0 && (
                      <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--t3)', padding: 16 }}>No attendance logs found</td></tr>
                    )}
                  </tbody>
                </table>
              ) : (
                <table className="dt">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Exam</th>
                      <th>Batch</th>
                      <th>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedStudentLogs?.marks ?? []).map((m: any, idx: number) => {
                      const pct = typeof m.score === 'number' && m.exam?.max_marks ? Math.round((m.score / m.exam.max_marks) * 100) : 0
                      return (
                        <tr key={idx}>
                          <td>{m.exam?.date ? new Date(m.exam.date).toLocaleDateString() : '—'}</td>
                          <td>{m.exam?.name || '—'}</td>
                          <td>{m.exam?.batch?.name || '—'}</td>
                          <td style={{ fontWeight: 600 }}>
                            {m.score === 'AB' ? 'Absent' : `${m.score} / ${m.exam?.max_marks} (${pct}%)`}
                          </td>
                        </tr>
                      )
                    })}
                    {(selectedStudentLogs?.marks ?? []).length === 0 && (
                      <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--t3)', padding: 16 }}>No marks logs found</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

