'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/client'
import { getInitials } from '@/lib/portal-mock-data'
import { useToast } from '@/components/Toast'

interface Batch {
  id: string
  name: string
}

interface StudentAttendance {
  studentId: string
  name: string
  status: 'PRESENT' | 'ABSENT' | 'LATE'
}

const today = new Date().toISOString().slice(0, 10)
const dayFromDate = (d: string) => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(d + 'T00:00:00').getDay()]

export default function InstituteAttendancePage() {
  const { toast } = useToast()
  const [batches, setBatches] = useState<Batch[]>([])
  const [aB, setAB] = useState('')
  const [date, setDate] = useState(today)
  const [roster, setRoster] = useState<StudentAttendance[]>([])
  const [ss, setSs] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sendingAlerts, setSendingAlerts] = useState(false)
  const [lastSentTime, setLastSentTime] = useState<number>(0)

  const aD = dayFromDate(date)

  // 1. Load Batches
  useEffect(() => {
    api('/api/batches')
      .then((data: Batch[]) => {
        setBatches(data)
        if (data.length > 0) {
          setAB(data[0].id)
        } else {
          setLoading(false)
        }
      })
      .catch(err => {
        toast(err.message, 'err')
        setLoading(false)
      })
  }, [])

  // 2. Load Attendance Roster for selected Batch & Date
  const loadRoster = () => {
    if (!aB) return
    setLoading(true)
    api(`/api/attendance?batchId=${aB}&date=${date}`)
      .then((res: { roster: Array<{ studentId: string; name: string }>; records: Array<{ studentId: string; status: 'PRESENT' | 'ABSENT' | 'LATE' }> }) => {
        const mapped = res.roster.map(student => {
          const rec = res.records.find(r => r.studentId === student.studentId)
          return {
            studentId: student.studentId,
            name: student.name,
            status: rec ? rec.status : ('PRESENT' as const),
          }
        })
        setRoster(mapped)
      })
      .catch(err => toast(err.message, 'err'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadRoster()
  }, [aB, date])

  const mark = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE') => {
    setRoster(prev => prev.map(s => s.studentId === studentId ? { ...s, status } : s))
  }

  const save = async () => {
    if (!aB) return
    setSaving(true)
    try {
      await api('/api/attendance', {
        method: 'POST',
        body: JSON.stringify({
          batchId: aB,
          date,
          records: roster.map(r => ({ studentId: r.studentId, status: r.status })),
        })
      })
      toast('Attendance saved successfully')
    } catch (err: any) {
      toast(err.message, 'err')
    } finally {
      setSaving(false)
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

  const filtered = roster.filter(s => !ss || s.name.toLowerCase().includes(ss.toLowerCase()))

  return (
    <div>
      <div className="si si-1" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <select className="fi fi-sm" value={aB} onChange={e => setAB(e.target.value)}>
          {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          {batches.length === 0 && <option value="">No batches</option>}
        </select>
        <input className="fi" type="date" style={{ width: 'auto' }} value={date} onChange={e => setDate(e.target.value)} />
        <span style={{ fontSize: 12, color: 'var(--t3)', whiteSpace: 'nowrap' }}>{aD}</span>
        <div className="sb" style={{ marginLeft: 4 }}>
          <i className="fa-solid fa-magnifying-glass" style={{ fontSize: 11, color: 'var(--t3)' }} />
          <input placeholder="Search student..." value={ss} onChange={e => setSs(e.target.value)} />
        </div>
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary btn-sm" disabled={saving || loading || !aB} onClick={save}>
          <i className="fa-solid fa-floppy-disk" style={{ marginRight: 6 }} />
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button className="btn btn-ghost btn-sm" disabled={sendingAlerts} onClick={sendAlerts}>
          <i className="fa-solid fa-paper-plane" style={{ marginRight: 6 }} />
          {sendingAlerts ? 'Sending...' : 'Send WhatsApp Alerts'}
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--t3)' }}>Loading roster...</div>
      ) : (
        <div className="card si si-2" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="dt">
            <thead>
              <tr>
                <th>Student</th>
                <th style={{ textAlign: 'center' }}>Present</th>
                <th style={{ textAlign: 'center' }}>Late</th>
                <th style={{ textAlign: 'center' }}>Absent</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => {
                const av = getInitials(s.name, i)
                return (
                  <tr key={s.studentId}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, background: av.bg, color: av.color }}>{av.initials}</div>
                        <span style={{ color: 'var(--t1)', fontWeight: 500 }}>{s.name}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div className={'ac' + (s.status === 'PRESENT' ? ' sp' : '')} onClick={() => mark(s.studentId, 'PRESENT')}>Present</div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div className={'ac' + (s.status === 'LATE' ? ' sl' : '')} onClick={() => mark(s.studentId, 'LATE')}>Late</div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div className={'ac' + (s.status === 'ABSENT' ? ' sa' : '')} onClick={() => mark(s.studentId, 'ABSENT')}>Absent</div>
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
    </div>
  )
}


