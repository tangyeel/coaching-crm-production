'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import '@/app/portal.css'

export default function ParentSignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/signup/parent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password }),
      })
      const data = await res.json().catch(() => ({}))
      
      if (!res.ok) {
        throw new Error(data.error || 'Signup failed')
      }

      router.push('/parent')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="portal" style={{ minHeight: '100vh', overflow: 'auto' }}>
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="dot-grid" />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 16, position: 'relative', zIndex: 10 }}>
        <div className="auth-card" style={{ maxWidth: 440 }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(99, 102, 241, 0.1)' }}>
                <i className="fa-solid fa-family" style={{ color: 'var(--acc)', fontSize: 15 }} />
              </div>
              <span className="font-display" style={{ fontWeight: 700, fontSize: 18 }}>Parent Registration</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--t3)', margin: '4px 0 0' }}>Register to track your child&apos;s academic progress</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="fl">Full Name</label>
                <input
                  className="fi"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Enter your name"
                  required
                />
              </div>
              
              <div>
                <label className="fl">Email Address</label>
                <input
                  className="fi"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label className="fl">Mobile Phone Number</label>
                <input
                  className="fi"
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="e.g. +91 99999 88888"
                  required
                />
                <p style={{ fontSize: 10, color: 'var(--t3)', marginTop: 4 }}>
                  Ensure this phone number matches the guardian phone registered by the student.
                </p>
              </div>

              <div>
                <label className="fl">Choose Password</label>
                <input
                  className="fi"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  minLength={6}
                  required
                />
              </div>

              {error && <p style={{ fontSize: 12, color: 'var(--err)', margin: 0 }}>{error}</p>}

              <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: 8 }}>
                {loading ? 'Creating account...' : 'Create Parent Account'}
              </button>
            </div>
          </form>

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--bdr)', textAlign: 'center' }}>
            <p style={{ fontSize: 12, color: 'var(--t3)', margin: 0 }}>
              Already registered?{' '}
              <Link href="/parent/login" style={{ color: 'var(--acc)', fontWeight: 600 }}>
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
