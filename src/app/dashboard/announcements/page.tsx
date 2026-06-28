'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/client'
import { motion, AnimatePresence } from 'framer-motion'
import PageTransition from '@/components/PageTransition'

const empty = { title: '', body: '', batchId: '' }

export default function AnnouncementsPage() {
  const [items, setItems] = useState<any[] | null>(null)
  const [batches, setBatches] = useState<any[]>([])
  const [me, setMe] = useState<any>(null)
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => api('/api/announcements').then(setItems).catch((e) => setError(e.message))
  useEffect(() => {
    load()
    api('/api/auth/me').then(setMe).catch(() => {})
    api('/api/batches').then(setBatches).catch(() => {})
  }, [])

  async function publish(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api('/api/announcements', {
        method: 'POST',
        body: JSON.stringify({ title: form.title, body: form.body, batchId: form.batchId || null }),
      })
      setForm(empty)
      await load()
    } catch (err: any) { setError(err.message) }
    setBusy(false)
  }

  const canPost = me && me.role !== 'STUDENT'

  return (
    <PageTransition>
      <h1>Announcements</h1>
      {canPost && (
        <div className="card">
          <h2>Publish announcement</h2>
          <form onSubmit={publish} style={{ display: 'grid', gap: 12 }}>
            <div className="row" style={{ display: 'grid', gap: 12, gridTemplateColumns: '2fr 1fr' }}>
              <div><label>Title</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
              <div>
                <label>Audience</label>
                <select value={form.batchId} onChange={(e) => setForm({ ...form, batchId: e.target.value })}>
                  <option value="">🏢 Whole institute</option>
                  {batches.map((b) => <option key={b.id} value={b.id}>📚 {b.name}</option>)}
                </select>
              </div>
            </div>
            <div><label>Message</label><textarea rows={3} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required /></div>
            <div><button className="btn" disabled={busy}>{busy ? 'Publishing…' : '📢 Publish'}</button></div>
          </form>
          {error && <p className="error">{error}</p>}
        </div>
      )}
      <div className="card">
        {!items ? (
          <div className="skeleton" style={{ height: 140 }} />
        ) : items.length === 0 ? (
          <p className="muted">No announcements yet.</p>
        ) : (
          <AnimatePresence mode="popLayout">
            {items.map((a, idx) => (
              <motion.div
                key={a.id}
                className="announce"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2, delay: idx * 0.04 }}
              >
                <strong>{a.title}</strong>{' '}
                <span className={`badge ${a.batch ? 'indigo' : 'green'}`}>{a.batch ? a.batch.name : 'Institute-wide'}</span>
                <p style={{ margin: '6px 0' }}>{a.body}</p>
                <span className="muted">
                  {a.author?.name ? `By ${a.author.name} · ` : ''}
                  {new Date(a.createdAt).toLocaleString()}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </PageTransition>
  )
}
