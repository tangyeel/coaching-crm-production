'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import '@/app/portal.css'

type AuthView = 'login' | 'signup' | 'invite' | 'invite2' | 'enroll'
type Role = 'admin' | 'teacher' | 'student' | 'parent'

export default function LoginPage() {
  const router = useRouter()
  const [view, setView] = useState<AuthView>('login')
  const [role, setRole] = useState<Role>('admin')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
                  <label className="fl">Password</label>
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
                <button className="btn btn-ghost" style={{ flex: 1, fontSize: 12 }} onClick={() => setView('signup')}>Sign Up</button>
                <button className="btn btn-ghost" style={{ flex: 1, fontSize: 12 }} onClick={() => setView('enroll')}>Enroll</button>
              </div>
            </div>
            <div style={{ marginTop: 12, textAlign: 'center' }}>
              <button style={{ fontSize: 12, color: 'var(--t3)', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setView('invite')}>
                Have an invite code?
              </button>
            </div>
          </div>
        )}

        {view === 'signup' && (
          <div className="auth-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setView('login')}><i className="fa-solid fa-arrow-left" style={{ marginRight: 6 }} />Back</button>
            </div>
            <h2 className="font-display" style={{ fontWeight: 700, fontSize: 20, marginBottom: 4 }}>Register Institute</h2>
            <p style={{ fontSize: 12, marginBottom: 24, color: 'var(--t3)' }}>Request onboarding</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="fl">Institute Name</label>
                <input className="fi" placeholder="e.g. Apex Coaching Academy" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label className="fl">Your Name</label><input className="fi" placeholder="Full name" /></div>
                <div><label className="fl">Phone</label><input className="fi" placeholder="+91 ..." /></div>
              </div>
              <div>
                <label className="fl">Email</label>
                <input className="fi" type="email" placeholder="admin@institute.com" />
              </div>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setView('login')}>Submit</button>
            </div>
          </div>
        )}

        {view === 'invite' && (
          <div className="auth-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setView('login')}><i className="fa-solid fa-arrow-left" style={{ marginRight: 6 }} />Back</button>
            </div>
            <h2 className="font-display" style={{ fontWeight: 700, fontSize: 20, marginBottom: 4 }}>Join with Invite</h2>
            <p style={{ fontSize: 12, marginBottom: 24, color: 'var(--t3)' }}>Enter the invite code</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div><label className="fl">Invite Code</label><input className="fi" placeholder="INV-ABC123" /></div>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setView('invite2')}>Validate</button>
            </div>
          </div>
        )}

        {view === 'invite2' && (
          <div className="auth-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setView('invite')}><i className="fa-solid fa-arrow-left" style={{ marginRight: 6 }} />Back</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, background: 'var(--okd)', color: 'var(--ok)' }}>
                <i className="fa-solid fa-check" />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ok)' }}>Validated</span>
            </div>
            <h2 className="font-display" style={{ fontWeight: 700, fontSize: 20, marginBottom: 4 }}>Create Account</h2>
            <p style={{ fontSize: 12, marginBottom: 24, color: 'var(--t3)' }}>{role} profile</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label className="fl">Full Name</label><input className="fi" placeholder="Name" /></div>
                <div><label className="fl">Phone</label><input className="fi" placeholder="+91 ..." /></div>
              </div>
              <div><label className="fl">Email</label><input className="fi" type="email" placeholder="you@email.com" /></div>
              <div><label className="fl">Password</label><input className="fi" type="password" placeholder="Password" /></div>
              <div><label className="fl">Guardian Name</label><input className="fi" placeholder="Father/Mother name" /></div>
              <div><label className="fl">Guardian Phone</label><input className="fi" placeholder="+91 ..." /></div>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setView('login')}>Create</button>
            </div>
          </div>
        )}

        {view === 'enroll' && (
          <div className="auth-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setView('login')}><i className="fa-solid fa-arrow-left" style={{ marginRight: 6 }} />Back</button>
            </div>
            <h2 className="font-display" style={{ fontWeight: 700, fontSize: 20, marginBottom: 4 }}>Public Enrollment</h2>
            <p style={{ fontSize: 12, marginBottom: 24, color: 'var(--t3)' }}>Join a batch with join code</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div><label className="fl">Join Code</label><input className="fi" placeholder="JOIN-A1-X7K9" /></div>
              <div><label className="fl">Student Name</label><input className="fi" placeholder="Full name" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label className="fl">Email</label><input className="fi" type="email" placeholder="you@email.com" /></div>
                <div><label className="fl">Phone</label><input className="fi" placeholder="+91 ..." /></div>
              </div>
              <div><label className="fl">Guardian Name</label><input className="fi" placeholder="Father/Mother" /></div>
              <div><label className="fl">Guardian Phone</label><input className="fi" placeholder="+91 ..." /></div>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setView('login')}>Submit</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
