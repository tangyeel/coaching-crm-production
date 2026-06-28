'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/client'
import { useToast } from '@/components/Toast'

export default function InstituteAccountPage() {
  const { toast } = useToast()
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [updatingPassword, setUpdatingPassword] = useState(false)

  // Settings state
  const [whatsappToken, setWhatsappToken] = useState('')
  const [whatsappPhoneId, setWhatsappPhoneId] = useState('')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [updatingSettings, setUpdatingSettings] = useState(false)

  useEffect(() => {
    api('/api/institute/settings')
      .then(res => {
        setWhatsappToken(res.whatsappToken || '')
        setWhatsappPhoneId(res.whatsappPhoneId || '')
        setWebhookUrl(res.webhookUrl || '')
        setJoinCode(res.joinCode || '')
      })
      .catch(err => {
        toast(err.message, 'err')
      })
      .finally(() => {
        setLoadingSettings(false)
      })
  }, [toast])

  const handleUpdatePassword = async () => {
    if (!currentPassword) {
      toast('Please enter your current password', 'err')
      return
    }
    if (newPassword.length < 6) {
      toast('New password must be at least 6 characters', 'err')
      return
    }
    if (newPassword !== confirmPassword) {
      toast('Passwords do not match', 'err')
      return
    }

    setUpdatingPassword(true)
    try {
      await api('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword })
      })
      toast('Password updated successfully', 'ok')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      toast(err.message, 'err')
    } finally {
      setUpdatingPassword(false)
    }
  }

  const handleSaveSettings = async () => {
    setUpdatingSettings(true)
    try {
      await api('/api/institute/settings', {
        method: 'PATCH',
        body: JSON.stringify({ whatsappToken, whatsappPhoneId, webhookUrl })
      })
      toast('Settings saved successfully', 'ok')
    } catch (err: any) {
      toast(err.message, 'err')
    } finally {
      setUpdatingSettings(false)
    }
  }

  return (
    <div style={{ maxWidth: 512 }}>
      <div className="card si si-1" style={{ marginBottom: 20 }}>
        <h3 className="font-display" style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, color: 'var(--t1)' }}>Change Password</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label className="fl">Current</label>
            <input className="fi" type="password" placeholder="Current password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
          </div>
          <div>
            <label className="fl">New</label>
            <input className="fi" type="password" placeholder="New password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          </div>
          <div>
            <label className="fl">Confirm</label>
            <input className="fi" type="password" placeholder="Confirm password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
          </div>
          <div>
            <button className="btn btn-primary btn-sm" onClick={handleUpdatePassword} disabled={updatingPassword}>
              {updatingPassword ? 'Updating...' : 'Update'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="card si si-2">
        <h3 className="font-display" style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, color: 'var(--t1)' }}>Institute Settings</h3>
        {loadingSettings ? (
          <div style={{ color: 'var(--t3)', fontSize: 12 }}>Loading settings...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label className="fl">WhatsApp Token</label>
              <input className="fi" type="password" placeholder="Meta access token" value={whatsappToken} onChange={e => setWhatsappToken(e.target.value)} />
            </div>
            <div>
              <label className="fl">Phone ID</label>
              <input className="fi" placeholder="Meta phone ID" value={whatsappPhoneId} onChange={e => setWhatsappPhoneId(e.target.value)} />
            </div>
            <div>
              <label className="fl">Webhook URL</label>
              <input className="fi" placeholder="https://example.com/webhook" value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} />
            </div>
            <div>
              <label className="fl">Join Code</label>
              <input className="fi" style={{ opacity: 0.8, color: 'var(--t2)' }} readOnly value={joinCode} />
            </div>
            <div>
              <button className="btn btn-primary btn-sm" onClick={handleSaveSettings} disabled={updatingSettings}>
                {updatingSettings ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="card si si-3" style={{ marginTop: 20 }}>
        <h3 className="font-display" style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: 'var(--t1)' }}>Export Institute Dataset</h3>
        <p style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 16 }}>Download a complete export of all students, batches, marks, attendance, and invoices as a single JSON file.</p>
        <div>
          <a href="/api/reports/export" download className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <i className="fa-solid fa-file-export"></i> Download JSON Export
          </a>
        </div>
      </div>
    </div>
  )
}

