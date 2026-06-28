'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/client'
import { motion, AnimatePresence } from 'framer-motion'
import PageTransition from '@/components/PageTransition'
import { useToast } from '@/components/Toast'
import * as XLSX from 'xlsx'

const empty = { name: '', email: '', password: '', phone: '', guardianName: '', guardianPhone: '', feeStatus: 'DUE', batchIds: [] as string[] }
const PER_PAGE = 8

export default function StudentsPage() {
  const [data, setData] = useState<any>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [batches, setBatches] = useState<any[]>([])
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  
  const [importMode, setImportMode] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const { toast } = useToast()

  const load = (p = page, q = search) =>
    api(`/api/students?page=${p}&perPage=${PER_PAGE}&search=${encodeURIComponent(q)}`)
      .then(setData)
      .catch((e) => setError(e.message))

  useEffect(() => {
    const t = setTimeout(() => load(page, search), 250)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search])

  useEffect(() => {
    api('/api/batches').then(setBatches).catch(() => {})
  }, [])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api('/api/students', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          phone: form.phone || undefined,
          guardianName: form.guardianName || undefined,
          guardianPhone: form.guardianPhone || undefined,
        }),
      })
      setForm(empty)
      await load()
    } catch (err: any) { setError(err.message) }
    setBusy(false)
  }

  async function remove(id: string) {
    if (!confirm('Remove this student?')) return
    try { await api(`/api/students/${id}`, { method: 'DELETE' }); await load() } catch (err: any) { setError(err.message) }
  }

  async function resetPassword(email: string) {
    const pw = prompt(`New password for ${email} (min 6 characters):`)
    if (!pw) return
    try {
      await api('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, newPassword: pw }) })
      alert('Password reset \u2713')
    } catch (err: any) { setError(err.message) }
  }

  async function toggleFee(s: any) {
    const feeStatus = s.feeStatus === 'PAID' ? 'DUE' : 'PAID'
    try { await api(`/api/students/${s.id}`, { method: 'PATCH', body: JSON.stringify({ feeStatus }) }); await load() } catch (err: any) { setError(err.message) }
  }

  async function handleImport(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setImporting(true)
    setError('')
    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const csvData = XLSX.utils.sheet_to_csv(worksheet)

      const res = await api('/api/students/import', {
        method: 'POST',
        body: JSON.stringify({ csvData, batchIds: form.batchIds })
      })
      
      toast(res.message)
      setImportMode(false)
      setFile(null)
      await load()
    } catch (err: any) {
      setError(err.message)
    }
    setImporting(false)
  }

  const set = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value })
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.perPage)) : 1

  return (
    <PageTransition>
      <h1>Students</h1>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ marginBottom: 0 }}>{importMode ? 'Bulk import students (AI)' : 'Enroll student'}</h2>
          <button type="button" className="btn ghost sm" onClick={() => setImportMode(!importMode)}>
            {importMode ? 'Switch to manual entry' : 'Bulk import with AI'}
          </button>
        </div>
        
        {importMode ? (
          <form className="row" onSubmit={handleImport}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label>Upload Excel or CSV file</label>
              <input 
                type="file" 
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
                onChange={(e) => setFile(e.target.files?.[0] || null)} 
                required 
                style={{ background: 'var(--surface)' }}
              />
              <p className="muted" style={{ marginTop: 8 }}>
                The AI will automatically parse names, emails, phones, and guardian details from your file.
              </p>
            </div>
            <div>
              <label>Assign to Batches (Optional)</label>
              <select multiple value={form.batchIds} onChange={(e) => setForm({ ...form, batchIds: Array.from(e.target.selectedOptions).map((o) => o.value) })}>
                {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1', marginTop: 10 }}>
              <button className="btn" disabled={importing || !file}>{importing ? 'Parsing with AI…' : 'Import Students'}</button>
            </div>
          </form>
        ) : (
          <form className="row" onSubmit={add}>
            <div><label>Name</label><input value={form.name} onChange={set('name')} required /></div>
            <div><label>Email</label><input type="email" value={form.email} onChange={set('email')} required /></div>
            <div><label>Password</label><input type="password" value={form.password} onChange={set('password')} minLength={6} required /></div>
            <div><label>Phone</label><input value={form.phone} onChange={set('phone')} /></div>
            <div><label>Guardian name</label><input value={form.guardianName} onChange={set('guardianName')} /></div>
            <div><label>Guardian phone</label><input value={form.guardianPhone} onChange={set('guardianPhone')} /></div>
            <div>
              <label>Fee status</label>
              <select value={form.feeStatus} onChange={set('feeStatus')}>
                <option value="DUE">Due</option>
                <option value="PAID">Paid</option>
              </select>
            </div>
            <div>
              <label>Batches (Ctrl/Cmd-click for multiple)</label>
              <select multiple value={form.batchIds} onChange={(e) => setForm({ ...form, batchIds: Array.from(e.target.selectedOptions).map((o) => o.value) })}>
                {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <button className="btn" disabled={busy}>{busy ? 'Enrolling…' : 'Enroll student'}</button>
          </form>
        )}
        {error && <p className="error">{error}</p>}
      </div>
      <div className="card">
        <div className="toolbar">
          <div style={{ flex: 1 }}>
            <label>Search</label>
            <input
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
        </div>
        {!data ? (
          <div className="skeleton" style={{ height: 160 }} />
        ) : data.items.length === 0 ? (
          <p className="muted">{search ? 'No students match your search.' : 'No students yet. Enroll your first student above.'}</p>
        ) : (
          <>
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Guardian</th><th>Batches</th><th>Fees</th><th /></tr></thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {data.items.map((s: any, idx: number) => (
                    <motion.tr
                      key={s.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2, delay: idx * 0.04 }}
                    >
                      <td><strong>{s.user.name}</strong></td>
                      <td>{s.user.email}</td>
                      <td>{s.guardianName ? `${s.guardianName} (${s.guardianPhone || '-'})` : '-'}</td>
                      <td>{s.enrollments.length === 0 ? '-' : s.enrollments.map((e: any) => <span key={e.batch.id} className="badge indigo" style={{ marginRight: 4 }}>{e.batch.name}</span>)}</td>
                      <td>
                        <span
                          className={`badge ${s.feeStatus === 'PAID' ? 'green' : 'red'}`}
                          style={{ cursor: 'pointer' }}
                          title="Click to toggle"
                          onClick={() => toggleFee(s)}
                        >
                          {s.feeStatus}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button className="btn outline sm" style={{ marginRight: 8 }} onClick={() => resetPassword(s.user.email)}>Reset password</button>
                        <button className="btn danger sm" onClick={() => remove(s.id)}>Remove</button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
            <div className="pager">
              <button className="btn outline sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
              <span className="muted">Page {data.page} of {totalPages} · {data.total} students</span>
              <button className="btn outline sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next →</button>
            </div>
          </>
        )}
      </div>
    </PageTransition>
  )
}
