'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import '@/app/portal.css'

export default function ParentLoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json().catch(() => ({}))
      setLoading(false)
      
      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials')
      }

      const role = data.role as string
      if (role === 'PARENT') {
        router.push('/parent')
      } else {
        // Fallback for other roles if they accidentally use this screen
        if (role === 'SUPER_ADMIN') router.push('/admin')
        else if (role === 'INSTITUTE_ADMIN' || role === 'TEACHER') router.push('/institute')
        else if (role === 'STUDENT') router.push('/student')
        else router.push('/dashboard')
      }
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
        <div className="auth-card" style={{ maxWidth: 400 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(99, 102, 241, 0.1)' }}>
                <i className="fa-solid fa-family" style={{ color: 'var(--acc)', fontSize: 15 }} />
              </div>
              <span className="font-display" style={{ fontWeight: 700, fontSize: 18 }}>Parent Sign In</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--t3)', margin: '4px 0 0' }}>Access your child&apos;s grades and attendance tracker</p>
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                <label className="fl">Password</label>
                <input
                  className="fi"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
              </div>

              {error && <p style={{ fontSize: 12, color: 'var(--err)', margin: 0 }}>{error}</p>}

              <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: 4 }}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </div>
          </form>

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--bdr)', textAlign: 'center' }}>
            <p style={{ fontSize: 12, color: 'var(--t3)', margin: 0 }}>
              Need an account?{' '}
              <Link href="/parent/signup" style={{ color: 'var(--acc)', fontWeight: 600 }}>
                Register Here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
