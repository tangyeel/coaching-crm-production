'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/client'

export default function StudentAnnouncementsPage() {
  const [anns, setAnns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api('/api/announcements')
      .then((res) => {
        setAnns(res)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load announcements:', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--t3)' }}>Loading announcements...</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {anns.map((a: any, i: number) => (
        <div key={a.id || i} className={'card si si-' + ((i % 6) + 1)} style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <h4 className="font-display" style={{ fontWeight: 600, fontSize: 14, color: 'var(--t1)', margin: 0 }}>{a.title}</h4>
            {!a.batch_id ? <span className="badge b-inf">Institute</span> : <span className="badge b-acc">{a.batch?.name || 'Class'}</span>}
          </div>
          <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 8 }}>{a.body}</p>
          <p style={{ fontSize: 11, color: 'var(--t3)', margin: 0 }}>
            {new Date(a.created_at).toLocaleDateString()} — {a.author?.name || 'Staff'}
          </p>
        </div>
      ))}
      {anns.length === 0 && (
        <div style={{ textAlign: 'center', padding: 32, color: 'var(--t3)' }}>No announcements found</div>
      )}
    </div>
  )
}
