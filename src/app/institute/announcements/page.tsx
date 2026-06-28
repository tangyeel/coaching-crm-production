'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/client'
import { useToast } from '@/components/Toast'

interface Batch {
  id: string
  name: string
}

interface Announcement {
  id: string
  title: string
  body: string
  batch_id: string | null
  created_at: string
  batch: { name: string } | null
  author: { name: string } | null
}

export default function InstituteAnnouncementsPage() {
  const { toast } = useToast()
  const [anns, setAnns] = useState<Announcement[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [form, setForm] = useState({ title: '', body: '', target: 'all' })
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)

  const loadData = () => {
    setLoading(true)
    Promise.all([
      api('/api/batches'),
      api('/api/announcements')
    ])
      .then(([batchesData, annsData]) => {
        setBatches(batchesData)
        setAnns(annsData)
      })
      .catch(err => toast(err.message, 'err'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  const publish = async () => {
    if (!form.title.trim()) { toast('Enter title', 'err'); return }
    if (!form.body.trim()) { toast('Enter content', 'err'); return }

    setPublishing(true)
    try {
      const batchId = form.target === 'all' ? null : form.target
      await api('/api/announcements', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title,
          body: form.body,
          batchId,
        })
      })
      toast('Announcement published')
      setForm({ title: '', body: '', target: 'all' })
      loadData()
    } catch (err: any) {
      toast(err.message, 'err')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div>
      <div className="card si si-1" style={{ marginBottom: 20 }}>
        <h3 className="font-display" style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, color: 'var(--t1)' }}>Publish Announcement</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label className="fl">Title</label><input className="fi" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
            <div>
              <label className="fl">Target Audience</label>
              <select className="fi" value={form.target} onChange={e => setForm(p => ({ ...p, target: e.target.value }))}>
                <option value="all">Whole Institute</option>
                {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </div>
          <div><label className="fl">Content</label><textarea className="fi" rows={3} value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} /></div>
          <div>
            <button className="btn btn-primary btn-sm" disabled={publishing || loading} onClick={publish}>
              <i className="fa-solid fa-paper-plane" style={{ marginRight: 6 }} />
              {publishing ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--t3)' }}>Loading announcements...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {anns.map((a, i) => (
            <div key={a.id} className={'card si si-' + ((i % 6) + 2)} style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <h4 className="font-display" style={{ fontWeight: 600, fontSize: 14, color: 'var(--t1)', margin: 0 }}>{a.title}</h4>
                {!a.batch_id ? <span className="badge b-inf">Institute-wide</span> : <span className="badge b-acc">{a.batch?.name || 'Batch'}</span>}
              </div>
              <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 8 }}>{a.body}</p>
              <p style={{ fontSize: 11, color: 'var(--t3)', margin: 0 }}>
                {new Date(a.created_at || Date.now()).toLocaleDateString()} — {a.author?.name || 'System'}
              </p>
            </div>
          ))}
          {anns.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--t3)', padding: 32 }}>No announcements published yet.</div>
          )}
        </div>
      )}
    </div>
  )
}


