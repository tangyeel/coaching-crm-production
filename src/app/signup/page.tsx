'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function OnboardPage() {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const [instituteName, setInstituteName] = useState('')
  const [institutePhone, setInstitutePhone] = useState('')
  const [instituteEmail, setInstituteEmail] = useState('')
  const [instituteAddress, setInstituteAddress] = useState('')
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPhone, setAdminPhone] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instituteName, institutePhone, instituteEmail, instituteAddress,
          adminName, adminEmail,
          adminPhone: adminPhone || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Submission failed')
      setDone(true)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="login-wrap">
        <div className="login-card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <div className="login-title" style={{ fontSize: 22 }}>Request Submitted!</div>
          <p className="login-sub muted" style={{ marginBottom: 24, lineHeight: 1.6 }}>
            Your institute onboarding request has been sent.<br />
            The platform admin will review and activate your account.
          </p>
          <Link href="/login" className="btn" style={{ display: 'inline-block' }}>
            Back to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="login-wrap" style={{ alignItems: 'flex-start', paddingTop: 40 }}>
      <form onSubmit={submit} className="login-card" style={{ maxWidth: 520, padding: 32 }}>
        <div className="login-title" style={{ fontSize: 22 }}>Onboard Your Institute</div>
        <p className="login-sub muted" style={{ marginBottom: 24 }}>
          Fill in your details and the admin will activate your account
        </p>
        <div style={{ display: 'grid', gap: 20 }}>
          <div>
            <h2 style={{ fontSize: 13, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700, marginBottom: 10 }}>
              Institute Details
            </h2>
            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label>Institute Name</label>
                <input value={instituteName} onChange={e => setInstituteName(e.target.value)}
                  placeholder="e.g. Bright Future Academy" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label>Phone</label>
                  <input value={institutePhone} onChange={e => setInstitutePhone(e.target.value)}
                    placeholder="+91 9876543210" required />
                </div>
                <div>
                  <label>Email</label>
                  <input type="email" value={instituteEmail} onChange={e => setInstituteEmail(e.target.value)}
                    placeholder="contact@institute.com" required />
                </div>
              </div>
              <div>
                <label>Address / Location</label>
                <textarea value={instituteAddress} onChange={e => setInstituteAddress(e.target.value)}
                  placeholder="Full address" rows={2} required />
              </div>
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: 13, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700, marginBottom: 10 }}>
              Institute Admin
            </h2>
            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label>Your Name</label>
                <input value={adminName} onChange={e => setAdminName(e.target.value)}
                  placeholder="Full name" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label>Email</label>
                  <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)}
                    placeholder="you@example.com" required />
                </div>
                <div>
                  <label>Phone (optional)</label>
                  <input value={adminPhone} onChange={e => setAdminPhone(e.target.value)}
                    placeholder="+91 9876543210" />
                </div>
              </div>
            </div>
          </div>

          <button className="btn" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? 'Submitting…' : 'Submit Onboarding Request'}
          </button>
        </div>
        <div style={{ marginTop: 16, textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--brand)', fontWeight: 600 }}>Sign in</Link>
        </div>
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  )
}
