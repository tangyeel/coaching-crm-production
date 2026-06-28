'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/client'
import { getGrade, getGradeColor, getGradeBadge } from '@/lib/portal-mock-data'
import { useToast } from '@/components/Toast'

interface Batch {
  id: string
  name: string
}

interface Exam {
  id: string
  name: string
  max_marks: number
  date: string
}

interface StudentMark {
  studentId: string
  name: string
  score: string // string to handle empty input, "AB", or numbers
}

export default function InstituteMarksPage() {
  const { toast } = useToast()
  const [batches, setBatches] = useState<Batch[]>([])
  const [mB, setMB] = useState('')
  const [exams, setExams] = useState<Exam[]>([])
  const [mE, setME] = useState('')
  const [roster, setRoster] = useState<StudentMark[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState(false)
  const [busy, setBusy] = useState(false)
  const [sendingAlerts, setSendingAlerts] = useState(false)
  const [lastSentTime, setLastSentTime] = useState<number>(0)

  const [form, setForm] = useState({ name: '', batchId: '', total: '100', date: new Date().toISOString().slice(0, 10) })

  // 1. Load Batches
  useEffect(() => {
    api('/api/batches')
      .then((data: Batch[]) => {
        setBatches(data)
        if (data.length > 0) {
          setMB(data[0].id)
          setForm(f => ({ ...f, batchId: data[0].id }))
        } else {
          setLoading(false)
        }
      })
      .catch(err => {
        toast(err.message, 'err')
        setLoading(false)
      })
  }, [])

  // 2. Load Exams for selected Batch
  useEffect(() => {
    if (!mB) return
    setLoading(true)
    api(`/api/exams?batchId=${mB}`)
      .then((data: Exam[]) => {
        setExams(data)
        if (data.length > 0) {
          setME(data[0].id)
        } else {
          setME('')
          setRoster([])
          setLoading(false)
        }
      })
      .catch(err => {
        toast(err.message, 'err')
        setLoading(false)
      })
  }, [mB])

  // 3. Load Marks roster for selected Exam
  useEffect(() => {
    if (!mE) {
      setRoster([])
      return
    }
    setLoading(true)
    api(`/api/marks?examId=${mE}`)
      .then((res: { exam: { id: string; name: string; maxMarks: number }; roster: Array<{ studentId: string; name: string }>; marks: Array<{ studentId: string; score: string }> }) => {
        const mapped = res.roster.map(student => {
          const m = res.marks.find(x => x.studentId === student.studentId)
          return {
            studentId: student.studentId,
            name: student.name,
            score: m ? m.score : '0',
          }
        })
        setRoster(mapped)
      })
      .catch(err => toast(err.message, 'err'))
      .finally(() => setLoading(false))
  }, [mE])

  const selectedExam = exams.find(e => e.id === mE)

  const updateMark = (studentId: string, val: string) => {
    setRoster(prev => prev.map(s => s.studentId === studentId ? { ...s, score: val } : s))
  }

  const save = async () => {
    if (!mE) return
    setSaving(true)
    try {
      await api('/api/marks', {
        method: 'POST',
        body: JSON.stringify({
          examId: mE,
          marks: roster.map(r => ({
            studentId: r.studentId,
            score: r.score.toUpperCase() === 'AB' ? 'AB' : String(Number(r.score) || 0)
          }))
        })
      })
      toast('Marks saved successfully and parent notifications queued')
    } catch (err: any) {
      toast(err.message, 'err')
    } finally {
      setSaving(false)
    }
  }

  const createExam = async () => {
    if (!form.name.trim()) { toast('Enter exam name', 'err'); return }
    if (!form.batchId) { toast('Select batch', 'err'); return }
    setBusy(true)
    try {
      const exam = await api('/api/exams', {
        method: 'POST',
        body: JSON.stringify({
          batchId: form.batchId,
          name: form.name,
          maxMarks: Number(form.total) || 100,
          date: form.date,
        })
      })
      toast(`Exam "${exam.name}" created`)
      setModal(false)
      setForm({ name: '', batchId: mB || (batches[0]?.id ?? ''), total: '100', date: new Date().toISOString().slice(0, 10) })
      // Trigger reload by switching batch if needed, or reloading current batch
      if (mB === form.batchId) {
        // reload exams manually
        api(`/api/exams?batchId=${mB}`).then((data: Exam[]) => {
          setExams(data)
          setME(exam.id)
        })
      } else {
        setMB(form.batchId)
      }
    } catch (err: any) {
      toast(err.message, 'err')
    } finally {
      setBusy(false)
    }
  }

  const sendAlerts = async () => {
    const now = Date.now()
    if (now - lastSentTime < 5000) {
      toast('Please wait 5 seconds before triggering alerts again.', 'err')
      return
    }
    setLastSentTime(now)
    setSendingAlerts(true)
    try {
      const res = await api('/api/notifications/send', { method: 'POST' })
      if (res.message.includes('Failed:') && !res.message.includes('Failed: 0')) {
        toast(`✘ ${res.message}`, 'err')
      } else {
        toast(`✔ ${res.message}`)
      }
    } catch (err: any) {
      toast(err.message, 'err')
    } finally {
      setSendingAlerts(false)
    }
  }

  const filtered = roster.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div className="si si-1" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <select className="fi fi-sm" value={mB} onChange={e => setMB(e.target.value)}>
          {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          {batches.length === 0 && <option value="">No batches</option>}
        </select>
        <select className="fi fi-sm" value={mE} onChange={e => setME(e.target.value)}>
          {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          {exams.length === 0 && <option value="">No exams</option>}
        </select>
        <div style={{ flex: 1 }} />
        <div className="sb">
          <i className="fa-solid fa-magnifying-glass" style={{ fontSize: 11, color: 'var(--t3)' }} />
          <input placeholder="Search student..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="btn btn-primary btn-sm" disabled={saving || loading || !mE} onClick={save}>
          <i className="fa-solid fa-floppy-disk" style={{ marginRight: 6 }} />
          {saving ? 'Saving...' : 'Save Marks'}
        </button>
        <button className="btn btn-ghost btn-sm" disabled={sendingAlerts || loading || !mE} onClick={sendAlerts}>
          <i className="fa-solid fa-paper-plane" style={{ marginRight: 6 }} />
          {sendingAlerts ? 'Sending...' : 'Send WhatsApp Alerts'}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => setModal(true)}>
          <i className="fa-solid fa-plus" style={{ marginRight: 6 }} />
          Create Exam
        </button>
      </div>

      {selectedExam && (
        <div className="card si si-2" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: 'var(--t1)' }}>
            <span><i className="fa-solid fa-calendar" style={{ marginRight: 6, color: 'var(--acc)' }} />{selectedExam.date}</span>
            <span style={{ color: 'var(--t2)' }}>Max Marks: <strong style={{ color: 'var(--t1)' }}>{selectedExam.max_marks}</strong></span>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--t3)' }}>Loading marks roster...</div>
      ) : !mE ? (
        <div className="card si si-2" style={{ textAlign: 'center', padding: '48px' }}>
          <p style={{ color: 'var(--t3)' }}>No exams for this batch.</p>
        </div>
      ) : (
        <div className="card si si-3" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="dt">
            <thead>
              <tr>
                <th>Student</th>
                <th>Score / {selectedExam?.max_marks}</th>
                <th>%</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const sc = s.score.toUpperCase() === 'AB' ? 0 : Number(s.score) || 0
                const max = selectedExam?.max_marks || 100
                const pct = Math.round(sc / max * 100)
                return (
                  <tr key={s.studentId}>
                    <td style={{ color: 'var(--t1)', fontWeight: 500 }}>{s.name}</td>
                    <td>
                      <input
                        className="fi"
                        placeholder="e.g. 85 or AB"
                        style={{ width: 120, padding: '6px 10px' }}
                        value={s.score}
                        onChange={e => updateMark(s.studentId, e.target.value)}
                      />
                    </td>
                    <td><span className={'badge ' + getGradeBadge(pct)}>{s.score.toUpperCase() === 'AB' ? 'AB' : `${pct}%`}</span></td>
                    <td>
                      <span className="font-display" style={{ fontWeight: 700, color: getGradeColor(pct) }}>
                        {s.score.toUpperCase() === 'AB' ? 'AB' : getGrade(pct)}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--t3)', padding: 32 }}>No students found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className={'mo' + (modal ? ' open' : '')}>
        <div className="mo-bd" onClick={() => setModal(false)} />
        <div className="mo-box">
          <h3 className="font-display" style={{ fontWeight: 600, fontSize: 18, marginBottom: 20, color: 'var(--t1)' }}>Create Exam</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div><label className="fl">Name</label><input className="fi" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="fl">Batch</label>
                <select className="fi" value={form.batchId} onChange={e => setForm(p => ({ ...p, batchId: e.target.value }))}>
                  {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div><label className="fl">Total Marks</label><input className="fi" type="number" value={form.total} onChange={e => setForm(p => ({ ...p, total: e.target.value }))} /></div>
            </div>
            <div>
              <label className="fl">Date</label>
              <input className="fi" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
            </div>
            <button className="btn btn-primary w-full" disabled={busy} onClick={createExam}>{busy ? 'Creating...' : 'Create'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}


