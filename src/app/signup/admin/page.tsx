'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminSignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [instituteName, setInstituteName] = useState('')
  const [institutePhone, setInstitutePhone] = useState('')
  const [instituteEmail, setInstituteEmail] = useState('')
  const [instituteAddress, setInstituteAddress] = useState('')
  const [whatsappPhoneNumberId, setWhatsappPhoneNumberId] = useState('')
  const [whatsappAccessToken, setWhatsappAccessToken] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/signup/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, email, password,
          phone: phone || undefined,
          instituteName,
          institutePhone,
          instituteEmail,
          instituteAddress,
          whatsappPhoneNumberId: whatsappPhoneNumberId || undefined,
          whatsappAccessToken: whatsappAccessToken || undefined,
        }),
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

  return (
    <div className="dark-theme auth-page">
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="dot-grid" />

      <form onSubmit={submit} className="auth-card" style={{ maxWidth: 560, padding: 36 }}>
        <Link href="/signup" className="back-link" style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, display: 'inline-block', marginBottom: 16 }}>
          ← Back
        </Link>
        <div className="auth-title">Create Institute</div>
        <p className="auth-sub">Register your coaching institute and become the admin</p>

        <div style={{ display: 'grid', gap: 24 }}>
          {/* Institute Details */}
          <div>
            <h2 className="auth-section-title">Institute Details</h2>
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
                <label>Address</label>
                <textarea value={instituteAddress} onChange={e => setInstituteAddress(e.target.value)}
                  placeholder="Full address" rows={2} required />
              </div>
            </div>
          </div>

          {/* Admin Account */}
          <div>
            <h2 className="auth-section-title">Your Account</h2>
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
                    placeholder="Min 6 characters" minLength={6} required />
                </div>
              </div>
              <div>
                <label>Phone (optional)</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 9876543210" />
              </div>
            </div>
          </div>

          {/* WhatsApp Configuration */}
          <div>
            <h2 className="auth-section-title">
              WhatsApp Configuration <span style={{ fontWeight: 400, textTransform: 'none', color: 'var(--text-3)' }}>(optional)</span>
            </h2>
            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label>Meta Phone Number ID</label>
                <input value={whatsappPhoneNumberId} onChange={e => setWhatsappPhoneNumberId(e.target.value)}
                  placeholder="e.g. 123456789012345" />
              </div>
              <div>
                <label>Meta Access Token</label>
                <input value={whatsappAccessToken} onChange={e => setWhatsappAccessToken(e.target.value)}
                  placeholder="EAAT..." type="password" />
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>
                You can configure this later from Institute Settings
              </p>
            </div>
          </div>

          <button className="btn" disabled={loading} style={{ marginTop: 4, height: 46, fontSize: 15 }}>
            {loading ? 'Creating institute…' : 'Create Institute & Sign In'}
          </button>
        </div>

        {error && <p className="auth-error">{error}</p>}
      </form>
    </div>
  )
}
