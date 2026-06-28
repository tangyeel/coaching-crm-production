'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/client'
import PageTransition from '@/components/PageTransition'
import { useToast } from '@/components/Toast'

export default function AccountPage() {
  const [me, setMe] = useState<any>(null)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Settings states
  const [settings, setSettings] = useState({ whatsappToken: '', whatsappPhoneId: '', joinCode: '' })
  const [settingsBusy, setSettingsBusy] = useState(false)

  const { toast } = useToast()

  useEffect(() => {
    if (window.location.search.includes('force=1')) {
      setError('For security, you must change your temporary password before continuing.')
    }
  }, [])

  useEffect(() => {
    api('/api/auth/me').then((user) => {
      setMe(user)
      if (user?.role === 'INSTITUTE_ADMIN') {
        api('/api/institute/settings').then((s) => {
          setSettings({
            whatsappToken: s.whatsappToken || '',
            whatsappPhoneId: s.whatsappPhoneId || '',
            joinCode: s.joinCode || ''
          })
        }).catch(() => {})
      }
    }).catch(() => {})
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (next !== confirmPw) {
      setError('New passwords do not match')
      return
    }
    setBusy(true)
    try {
      await api('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      })
      setCurrent('')
      setNext('')
      setConfirmPw('')
      toast('Password updated successfully')
    } catch (err: any) { setError(err.message) }
    setBusy(false)
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault()
    setSettingsBusy(true)
    try {
      await api('/api/institute/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          whatsappToken: settings.whatsappToken || null,
          whatsappPhoneId: settings.whatsappPhoneId || null,
        }),
      })
      toast('Institute settings updated')
    } catch (err: any) {
      toast(err.message, 'err')
    }
    setSettingsBusy(false)
  }

  return (
    <PageTransition>
      <h1>Account</h1>
      <div className="grid cols-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', alignItems: 'start' }}>
        <div className="card">
          {me && (
            <p style={{ marginBottom: 18 }}>
              <strong>{me.name}</strong>{' '}
              <span className="badge indigo">{me.role.replace('_', ' ')}</span>
            </p>
          )}
          <h2>🔐 Change password</h2>
          <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
            <div>
              <label>Current password</label>
              <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
            </div>
            <div>
              <label>New password (min 6 characters)</label>
              <input type="password" value={next} onChange={(e) => setNext(e.target.value)} minLength={6} required />
            </div>
            <div>
              <label>Confirm new password</label>
              <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} minLength={6} required />
            </div>
            <div>
              <button className="btn" disabled={busy}>{busy ? 'Updating\u2026' : 'Update password'}</button>
            </div>
          </form>
          {error && <p className="error">{error}</p>}
        </div>

        {me?.role === 'INSTITUTE_ADMIN' && (
          <div className="card">
            <h2>🏢 Institute Settings</h2>
            {settings.joinCode && (
              <div style={{ marginBottom: 20, padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px dashed #cbd5e1' }}>
                <p className="muted" style={{ marginBottom: 4 }}>Institute Join Code (for student self-enrollment)</p>
                <strong style={{ fontSize: 18, color: 'var(--brand)', letterSpacing: 1 }}>{settings.joinCode}</strong>
              </div>
            )}
            
            <form onSubmit={saveSettings} style={{ display: 'grid', gap: 14 }}>
              <div>
                <label>WhatsApp Meta Token</label>
                <input 
                  type="password" 
                  value={settings.whatsappToken} 
                  onChange={(e) => setSettings({ ...settings, whatsappToken: e.target.value })} 
                  placeholder="Enter token to enable WhatsApp features" 
                />
              </div>
              <div>
                <label>WhatsApp Phone Number ID</label>
                <input 
                  value={settings.whatsappPhoneId} 
                  onChange={(e) => setSettings({ ...settings, whatsappPhoneId: e.target.value })} 
                  placeholder="e.g. 1234567890" 
                />
              </div>
              <div>
                <button className="btn" disabled={settingsBusy}>{settingsBusy ? 'Saving\u2026' : 'Save Settings'}</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </PageTransition>
  )
}
