'use client'

import { useState } from 'react'
import { api } from '@/lib/client'
import Link from 'next/link'
import PageTransition from '@/components/PageTransition'

export default function PublicEnrollment() {
  const [form, setForm] = useState({
    joinCode: new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('code') ?? '',
    name: '',
    email: '',
    password: '',
    phone: '',
    guardianRelation: 'Father',
    guardianName: '',
    guardianPhone: '',
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const res = await api('/api/enroll', { method: 'POST', body: JSON.stringify(form) })
      setMessage(res.message)
    } catch (err: any) { setError(err.message) }
    setLoading(false)
  }

  return (
    <PageTransition>
      <main className="container" style={{ maxWidth: 520, marginTop: 40 }}>
        <div className="card">
          <h1 style={{ textAlign: 'center' }}>🎓 Student Enrollment</h1>
          <p className="muted" style={{ textAlign: 'center', marginBottom: 20 }}>
            Enter your details and batch/institute code to join.
          </p>

          {message ? (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <h2 style={{ color: 'var(--success, #10b981)' }}>✅ {message}</h2>
              <p className="muted">You can now login to your student dashboard.</p>
              <Link href="/login" className="btn" style={{ marginTop: 20, display: 'inline-block' }}>Go to Login →</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
              <div>
                <label>Institute Code or Batch Code <span style={{ color: 'red' }}>*</span></label>
                <input placeholder="e.g. MATH23 or INST56" value={form.joinCode} onChange={set('joinCode')} required />
                <small className="muted">Ask your teacher/institute for this code.</small>
              </div>

              <hr style={{ border: 0, borderTop: '1px solid #eee' }} />
              <p style={{ fontWeight: 600, margin: 0 }}>Your Details</p>

              <div className="grid cols-2" style={{ gap: 12 }}>
                <div>
                  <label>Full Name <span style={{ color: 'red' }}>*</span></label>
                  <input value={form.name} onChange={set('name')} required />
                </div>
                <div>
                  <label>Phone Number</label>
                  <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+91..." />
                </div>
              </div>

              <div className="grid cols-2" style={{ gap: 12 }}>
                <div>
                  <label>Email <span style={{ color: 'red' }}>*</span></label>
                  <input type="email" value={form.email} onChange={set('email')} required />
                </div>
                <div>
                  <label>Password <span style={{ color: 'red' }}>*</span></label>
                  <input type="password" value={form.password} onChange={set('password')} minLength={6} required placeholder="min 6 chars" />
                </div>
              </div>

              <hr style={{ border: 0, borderTop: '1px solid #eee' }} />
              <p style={{ fontWeight: 600, margin: 0 }}>Guardian / Parent Details</p>

              <div className="grid cols-2" style={{ gap: 12 }}>
                <div>
                  <label>Relation</label>
                  <select value={form.guardianRelation} onChange={set('guardianRelation')}>
                    <option>Father</option>
                    <option>Mother</option>
                    <option>Guardian</option>
                  </select>
                </div>
                <div>
                  <label>{form.guardianRelation}'s Name</label>
                  <input value={form.guardianName} onChange={set('guardianName')} placeholder="Full name" />
                </div>
              </div>

              <div>
                <label>{form.guardianRelation}'s Phone (for WhatsApp alerts)</label>
                <input type="tel" value={form.guardianPhone} onChange={set('guardianPhone')} placeholder="+91..." />
              </div>

              {error && <p className="error">{error}</p>}

              <button className="btn" style={{ marginTop: 4 }} disabled={loading}>
                {loading ? 'Registering…' : 'Register & Join →'}
              </button>

              <p className="muted" style={{ textAlign: 'center', fontSize: 13 }}>
                Already registered? <Link href="/login">Login here</Link>
              </p>
            </form>
          )}
        </div>
      </main>
    </PageTransition>
  )
}
