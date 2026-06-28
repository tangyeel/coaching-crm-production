'use client'

import { useState } from 'react'
import { api } from '@/lib/client'
import { useToast } from '@/components/Toast'

export default function ParentAccountPage() {
  const { toast } = useToast()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [updating, setUpdating] = useState(false)

  const handleUpdate = async () => {
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

    setUpdating(true)
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
      setUpdating(false)
    }
  }

  return (
    <div style={{ maxWidth: 512 }}>
      <div className="card si si-1">
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
            <button className="btn btn-primary btn-sm" onClick={handleUpdate} disabled={updating}>
              {updating ? 'Updating...' : 'Update'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
