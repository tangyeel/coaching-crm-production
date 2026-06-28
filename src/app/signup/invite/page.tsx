'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

type Step = 'code' | 'form'

export default function InviteSignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<Step>('code')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [code, setCode] = useState(searchParams.get('code')?.toUpperCase() ?? '')
  const [validatedRole, setValidatedRole] = useState('')
  const [instituteName, setInstituteName] = useState('')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')

  const [guardianName, setGuardianName] = useState('')
  const [guardianPhone, setGuardianPhone] = useState('')

  const [studentPhone, setStudentPhone] = useState('')
  const [studentEmail, setStudentEmail] = useState('')

  async function validateCode(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/invite-codes/validate?code=${encodeURIComponent(code)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Invalid code')
      setValidatedRole(data.role)
      setInstituteName(data.instituteName)
      setStep('form')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const body: Record<string, any> = { code, name, email, password, phone: phone || undefined }
      if (validatedRole === 'STUDENT') {
        body.guardianName = guardianName || undefined
        body.guardianPhone = guardianPhone || undefined
      }
      if (validatedRole === 'PARENT') {
        body.studentPhone = studentPhone || undefined
        body.studentEmail = studentEmail || undefined
      }
      const res = await fetch('/api/auth/signup/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Signup failed')
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const roleLabel = validatedRole.charAt(0).toUpperCase() + validatedRole.slice(1).toLowerCase()

  if (step === 'code') {
    return (
      <div className="login-wrap">
        <form onSubmit={validateCode} className="login-card" style={{ maxWidth: 420 }}>
          <Link href="/signup" style={{ fontSize: 13, color: 'var(--brand)', fontWeight: 600, display: 'inline-block', marginBottom: 16 }}>
            ← Back
          </Link>
          <div className="login-title" style={{ fontSize: 22 }}>Enter Invite Code</div>
          <p className="login-sub muted" style={{ marginBottom: 24 }}>
            Use the code provided by your institute
          </p>
          <div style={{ display: 'grid', gap: 14 }}>
            <div>
              <label>Invite Code</label>
              <input value={code} onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. ABC1234" required
                style={{ textTransform: 'uppercase', letterSpacing: 2, fontSize: 18, textAlign: 'center', fontWeight: 700 }}
                maxLength={8} />
            </div>
            <button className="btn" disabled={loading || code.length < 4}>
              {loading ? 'Checking…' : 'Continue'}
            </button>
          </div>
          {error && <p className="error">{error}</p>}
        </form>
      </div>
    )
  }

  return (
    <div className="login-wrap" style={{ alignItems: 'flex-start', paddingTop: 40 }}>
      <form onSubmit={submit} className="login-card" style={{ maxWidth: 480, padding: 32 }}>
        <Link href="/signup" style={{ fontSize: 13, color: 'var(--brand)', fontWeight: 600, display: 'inline-block', marginBottom: 16 }}>
          ← Back
        </Link>
        <div className="login-title" style={{ fontSize: 22 }}>Join {instituteName}</div>
        <p className="login-sub muted" style={{ marginBottom: 20 }}>
          Signing up as <span className="badge indigo">{roleLabel}</span>
        </p>

        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <label>Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="Your name" required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" required />
              </div>
              <div>
                <label>Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Min 6 chars" minLength={6} required />
              </div>
            </div>
            <div>
              <label>Phone (optional)</label>
              <input value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="+91 9876543210" />
            </div>
          </div>

          {validatedRole === 'STUDENT' && (
            <div>
              <h2 style={{ fontSize: 13, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700, marginBottom: 10 }}>
                Guardian Details <span style={{ fontWeight: 400, textTransform: 'none', color: 'var(--muted-2)' }}>(optional)</span>
              </h2>
              <div style={{ display: 'grid', gap: 10 }}>
                <div>
                  <label>Guardian Name</label>
                  <input value={guardianName} onChange={e => setGuardianName(e.target.value)}
                    placeholder="Parent or guardian name" />
                </div>
                <div>
                  <label>Guardian Phone</label>
                  <input value={guardianPhone} onChange={e => setGuardianPhone(e.target.value)}
                    placeholder="+91 9876543210" />
                </div>
              </div>
            </div>
          )}

          {validatedRole === 'PARENT' && (
            <div>
              <h2 style={{ fontSize: 13, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700, marginBottom: 10 }}>
                Link to Your Child
              </h2>
              <div style={{ display: 'grid', gap: 10 }}>
                <div>
                  <label>Student Phone</label>
                  <input value={studentPhone} onChange={e => setStudentPhone(e.target.value)}
                    placeholder="Your child's phone number" />
                </div>
                <p style={{ fontSize: 12, color: 'var(--muted-2)', textAlign: 'center' }}>or</p>
                <div>
                  <label>Student Email</label>
                  <input type="email" value={studentEmail} onChange={e => setStudentEmail(e.target.value)}
                    placeholder="Your child's email" />
                </div>
              </div>
            </div>
          )}

          <button className="btn" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </div>

        {error && <p className="error">{error}</p>}
      </form>
    </div>
  )
}
