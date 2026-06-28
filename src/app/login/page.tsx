'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import '@/app/portal.css'

type AuthView = 'login' | 'signup' | 'invite' | 'invite2' | 'enroll' | 'forgot' | 'reset'
type Role = 'admin' | 'teacher' | 'student' | 'parent'

export default function LoginPage() {
  const router = useRouter()
  const [view, setView] = useState<AuthView>('login')
  const [role, setRole] = useState<Role>('admin')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [token, setToken] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get('token')
    if (t) {
      setToken(t)
      setView('reset')
    }
  }, [])

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const fd = new FormData(e.currentTarget)
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: fd.get('email'), password: fd.get('password') }),
    })
    const data = await res.json().catch(() => ({}))
    setLoading(false)
    if (!res.ok) { setError(data.error || 'Invalid credentials'); return }
    const r = data.role as string
    if (r === 'SUPER_ADMIN') router.push('/admin')
    else if (r === 'INSTITUTE_ADMIN') router.push('/institute')
    else if (r === 'TEACHER') router.push('/institute')
    else if (r === 'STUDENT') router.push('/student')
    else if (r === 'PARENT') router.push('/parent')
    else router.push('/dashboard')
  }

  async function handleForgotPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const fd = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fd.get('email') }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to request reset link')
      setForgotSent(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const fd = new FormData(e.currentTarget)
    const password = fd.get('password') as string
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to reset password')
      setResetSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="portal" style={{ minHeight: '100vh', overflow: 'auto' }}>
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="dot-grid" />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 16, position: 'relative', zIndex: 10 }}>
        {view === 'login' && (
          <div className="auth-card">
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accd)' }}>
                  <i className="fa-solid fa-bolt" style={{ color: 'var(--acc)', fontSize: 15 }} />
                </div>
                <span className="font-display" style={{ fontWeight: 700, fontSize: 18 }}>CoachFlow</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--t3)' }}>Sign in to your portal</p>
            </div>
            {/* Role tabs */}
            <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 10, background: 'var(--bg2)', marginBottom: 24 }}>
              {(['admin', 'teacher', 'student', 'parent'] as Role[]).map(r => (
                <div key={r} className={'rt' + (r === role ? ' active' : '')} onClick={() => setRole(r)}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </div>
              ))}
            </div>
            <form onSubmit={handleLogin}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="fl">Email</label>
                  <input className="fi" type="email" name="email" placeholder="you@institute.com" defaultValue={
                    role === 'admin' ? 'admin@brightfuture.test' : role === 'teacher' ? 'priya@brightfuture.test' : role === 'student' ? 'aarav@brightfuture.test' : ''
                  } />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="fl">Password</label>
                    <button type="button" style={{ fontSize: 11, color: 'var(--acc)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 4 }} onClick={() => { setView('forgot'); setError(''); }}>
                      Forgot password?
                    </button>
                  </div>
                  <input className="fi" type="password" name="password" placeholder="Enter password" defaultValue={
                    role === 'admin' ? 'admin123' : role === 'teacher' ? 'teacher123' : role === 'student' ? 'student123' : ''
                  } />
                </div>
                {error && <p style={{ fontSize: 12, color: 'var(--err)', margin: 0 }}>{error}</p>}
                <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>
              </div>
            </form>
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--bdr)' }}>
              <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--t3)', marginBottom: 12 }}>Don&apos;t have an account?</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost" style={{ flex: 1, fontSize: 12 }} onClick={() => router.push('/signup')}>Sign Up</button>
                <button className="btn btn-ghost" style={{ flex: 1, fontSize: 12 }} onClick={() => router.push('/enroll')}>Enroll</button>
              </div>
            </div>
            <div style={{ marginTop: 12, textAlign: 'center' }}>
              <button style={{ fontSize: 12, color: 'var(--t3)', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => router.push('/signup/invite')}>
                Have an invite code?
              </button>
            </div>
          </div>
        )}

        {view === 'forgot' && (
          <div className="auth-card" style={{ maxWidth: 400 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accd)' }}>
                  <i className="fa-solid fa-key" style={{ color: 'var(--acc)', fontSize: 15 }} />
                </div>
                <span className="font-display" style={{ fontWeight: 700, fontSize: 18 }}>Reset Password</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--t3)' }}>Enter your email to request a reset link</p>
            </div>

            {forgotSent ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--success-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <i className="fa-solid fa-envelope" style={{ color: 'var(--success)', fontSize: 20 }} />
                </div>
                <p style={{ fontSize: 13, color: 'var(--t1)', fontWeight: 500, marginBottom: 8 }}>Check your inbox</p>
                <p style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 24, lineHeight: 1.5 }}>
                  We have sent a secure password reset link to your email. Please click the link to configure your new password.
                </p>
                <button className="btn btn-primary w-full" onClick={() => { setView('login'); setForgotSent(false); setError(''); }}>
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label className="fl">Email Address</label>
                    <input className="fi" type="email" name="email" placeholder="you@institute.com" required />
                  </div>
                  {error && <p style={{ fontSize: 12, color: 'var(--err)', margin: 0 }}>{error}</p>}
                  <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
                    {loading ? 'Sending link…' : 'Send Reset Link'}
                  </button>
                  <button type="button" className="btn btn-ghost" style={{ width: '100%', fontSize: 12 }} onClick={() => { setView('login'); setError(''); }}>
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {view === 'reset' && (
          <div className="auth-card" style={{ maxWidth: 400 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accd)' }}>
                  <i className="fa-solid fa-lock" style={{ color: 'var(--acc)', fontSize: 15 }} />
                </div>
                <span className="font-display" style={{ fontWeight: 700, fontSize: 18 }}>New Password</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--t3)' }}>Configure a secure password for your account</p>
            </div>

            {resetSuccess ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--success-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <i className="fa-solid fa-circle-check" style={{ color: 'var(--success)', fontSize: 20 }} />
                </div>
                <p style={{ fontSize: 13, color: 'var(--t1)', fontWeight: 500, marginBottom: 8 }}>Password Updated</p>
                <p style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 24, lineHeight: 1.5 }}>
                  Your password has been successfully reset. You can now use your new credentials to sign in.
                </p>
                <button className="btn btn-primary w-full" onClick={() => { setView('login'); setResetSuccess(false); setToken(''); router.replace('/login'); }}>
                  Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label className="fl">Choose Password</label>
                    <input className="fi" type="password" name="password" placeholder="Min 6 characters" minLength={6} required />
                  </div>
                  {error && <p style={{ fontSize: 12, color: 'var(--err)', margin: 0 }}>{error}</p>}
                  <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
                    {loading ? 'Updating password…' : 'Reset Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

