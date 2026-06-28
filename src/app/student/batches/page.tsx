'use client'

import { useState, useEffect } from 'react'
import { CL } from '@/lib/portal-mock-data'
import { api } from '@/lib/client'

export default function StudentBatchesPage() {
  const [data, setData] = useState<any>(null)
  const [allBatches, setAllBatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api('/api/student/dashboard'),
      api('/api/batches')
    ])
      .then(([dashboardData, batchesList]) => {
        setData(dashboardData)
        setAllBatches(batchesList)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load student batches:', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--t3)' }}>Loading batches...</div>
  }

  if (!data) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--err)' }}>Failed to load batches.</div>
  }

  const myBatches = data.batches || []
  const myBatchIds = myBatches.map((b: any) => b.id)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      {allBatches.map((b: any, idx: number) => {
        const enr = b._count?.students ?? 0
        const cap = b.capacity ?? 30
        const pct = Math.round(enr / cap * 100)
        const col = CL[idx % 5]
        const pctColor = pct > 90 ? 'var(--err)' : pct > 70 ? 'var(--acc)' : 'var(--ok)'
        const mine = myBatchIds.includes(b.id)
        return (
          <div key={b.id} className={'card si si-' + ((idx % 6) + 1)} style={mine ? { borderColor: 'var(--acc)', background: 'var(--bg4)' } : {}}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <h4 className="font-display" style={{ fontWeight: 600, fontSize: 14, color: 'var(--t1)', margin: 0 }}>{b.name}</h4>
                <p style={{ fontSize: 11, marginTop: 2, color: 'var(--t3)' }}>{b.subject} — {b.schedule || 'No schedule'}</p>
              </div>
              {mine ? <span className="badge b-acc">My Batch</span> : <span className="badge b-inf">{b.join_code}</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, background: col + '22', color: col }}>
                <i className="fa-solid fa-user-tie" />
              </div>
              <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--t1)', margin: 0 }}>
                {b.teacher?.user?.name || 'Unassigned'}
              </p>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                <span style={{ color: 'var(--t2)' }}>{enr}/{cap}</span>
                <span style={{ color: pctColor, fontWeight: 600 }}>{pct}%</span>
              </div>
              <div className="cb"><div className="cf" style={{ width: pct + '%', background: col }} /></div>
            </div>
          </div>
        )
      })}
      {allBatches.length === 0 && (
        <div style={{ gridColumn: 'span 2', textAlign: 'center', color: 'var(--t3)', padding: 32 }}>No batches found</div>
      )}
    </div>
  )
}
