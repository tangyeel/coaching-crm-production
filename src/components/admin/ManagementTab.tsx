'use client'

import { ChangeEvent, FormEvent } from 'react'

interface Institute {
  id: string
  name: string
  email: string
  phone: string
  plan: string
  students: number
  teachers: number
  batches: number
  revenue: number
  status: string
  adminName: string
  adminEmail: string
  adminPhone?: string
  address?: string
  monthlyFee: number
  whatsappToken?: string
  whatsappPhoneId?: string
  messages?: number
  joinCode?: string
}

interface ManagementTabProps {
  form: any
  set: (name: string) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  busy: boolean
  onboard: (e: FormEvent) => void
  error: string
  pendingReqs: any[]
  approveRequest: (inst: any) => void
  rejectRequest: (inst: any) => void
  institutes: Institute[] | null
  analytics: any
  recordPayment: (i: Institute) => void
  editInstitute: (i: Institute) => void
  toggleStatus: (i: Institute) => void
  money: (n: number) => string
}

export default function ManagementTab({
  form,
  set,
  busy,
  onboard,
  error,
  pendingReqs,
  approveRequest,
  rejectRequest,
  institutes,
  analytics,
  recordPayment,
  editInstitute,
  toggleStatus,
  money,
}: ManagementTabProps) {
  return (
    <div>
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 16px 0', color: 'var(--text-1)' }}>Onboard New Institute</h3>
        <form onSubmit={onboard}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Institute name</label>
              <input value={form.name} onChange={set('name')} required placeholder="Bright Future Academy" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Institute email</label>
              <input type="email" value={form.email} onChange={set('email')} required placeholder="contact@institute.com" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Phone</label>
              <input value={form.phone} onChange={set('phone')} placeholder="+91 9876543210" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Plan</label>
              <select value={form.plan} onChange={set('plan')}>
                <option value="BASIC">Basic</option>
                <option value="PRO">Pro</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Monthly fee (₹)</label>
              <input type="number" min={0} value={form.monthlyFee} onChange={set('monthlyFee')} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>WhatsApp Token</label>
              <input type="password" value={form.whatsappToken} onChange={set('whatsappToken')} placeholder="Meta Graph API Token" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>WhatsApp Phone ID</label>
              <input value={form.whatsappPhoneId} onChange={set('whatsappPhoneId')} placeholder="Meta Phone Number ID" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Admin name</label>
              <input value={form.adminName} onChange={set('adminName')} required placeholder="Admin full name" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Admin email</label>
              <input type="email" value={form.adminEmail} onChange={set('adminEmail')} required placeholder="admin@institute.com" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Admin password</label>
              <input type="password" value={form.adminPassword} onChange={set('adminPassword')} minLength={6} required placeholder="Min 6 characters" />
            </div>
            <button className="btn" disabled={busy} style={{ alignSelf: 'flex-end', height: 44 }}>
              {busy ? 'Onboarding…' : 'Onboard institute'}
            </button>
          </div>
          {error && <p className="auth-error" style={{ marginTop: 12 }}>{error}</p>}
        </form>
      </div>

      {pendingReqs.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px 0', color: 'var(--text-1)' }}>
            Pending Onboarding Requests{' '}
            <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 6, background: 'var(--accent-dim)', color: 'var(--accent)', fontSize: 12, fontWeight: 600 }}>
              {pendingReqs.length}
            </span>
          </h3>
          {pendingReqs.map((inst, idx) => (
            <div
              key={inst.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 0',
                borderBottom: idx < pendingReqs.length - 1 ? '1px solid rgba(42,42,58,.3)' : 'none',
                gap: 16,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: 1, minWidth: 200 }}>
                <p style={{ fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>{inst.name}</p>
                <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '4px 0 0' }}>
                  {inst.email} · {inst.phone} · {inst.address}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '2px 0 0' }}>
                  Admin: {inst.adminName} · {inst.adminEmail}
                  {inst.adminPhone ? ` · ${inst.adminPhone}` : ''}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn sm" onClick={() => approveRequest(inst)}>Approve</button>
                <button className="btn sm danger" onClick={() => rejectRequest(inst)}>Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 16px 0', color: 'var(--text-1)' }}>
          All Institutes{' '}
          <span style={{ color: 'var(--text-3)', fontWeight: 400, fontSize: 13 }}>
            ({institutes ? institutes.filter(i => i.status !== 'PENDING').length : '...'})
          </span>
        </h3>
        {!institutes ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-3)' }}>Loading...</div>
        ) : institutes.filter(i => i.status !== 'PENDING').length === 0 ? (
          <p style={{ color: 'var(--text-3)', fontSize: 14 }}>No institutes yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Institute</th>
                  <th>Plan</th>
                  <th>Students</th>
                  <th>Teachers</th>
                  <th>Batches</th>
                  <th>Attendance</th>
                  <th>Messages</th>
                  <th>Revenue</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {institutes
                  .filter(i => i.status !== 'PENDING')
                  .map(i => {
                    const rate = analytics?.attendanceByInstitute?.find((a: any) => a.id === i.id)?.rate
                    return (
                      <tr key={i.id}>
                        <td>
                          <div style={{ fontWeight: 500, color: 'var(--text-1)' }}>{i.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{i.email}</div>
                          {i.joinCode && (
                            <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 4 }}>
                              Code: <strong>{i.joinCode}</strong>
                            </div>
                          )}
                        </td>
                        <td>
                          <span className="badge badge-accent">{i.plan}</span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-space)', fontWeight: 600, color: 'var(--text-1)' }}>
                          {i.students}
                        </td>
                        <td>{i.teachers}</td>
                        <td>{i.batches}</td>
                        <td>
                          {rate == null ? (
                            <span style={{ color: 'var(--text-3)' }}>—</span>
                          ) : (
                            <span className={`badge ${rate >= 75 ? 'badge-success' : rate >= 50 ? 'badge-accent' : 'badge-danger'}`}>
                              {rate}%
                            </span>
                          )}
                        </td>
                        <td style={{ fontFamily: 'var(--font-space)', fontWeight: 600, color: 'var(--text-1)' }}>
                          {i.messages ?? 0}
                        </td>
                        <td style={{ fontFamily: 'var(--font-space)', fontWeight: 600, color: 'var(--text-1)' }}>
                          {money(i.revenue)}
                        </td>
                        <td>
                          <span className={`badge ${i.status === 'ACTIVE' ? 'badge-success' : i.status === 'SUSPENDED' ? 'badge-danger' : 'badge-info'}`}>
                            {i.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <button className="btn outline sm" style={{ marginRight: 6 }} onClick={() => recordPayment(i)}>
                            Record Pymt
                          </button>
                          <button className="btn sm" style={{ marginRight: 6 }} onClick={() => editInstitute(i)}>
                            Edit
                          </button>
                          <button
                            className={`btn sm ${i.status === 'ACTIVE' ? 'danger' : ''}`}
                            onClick={() => toggleStatus(i)}
                            style={i.status !== 'ACTIVE' ? { background: 'var(--success)', boxShadow: '0 6px 18px -4px rgba(16,185,129,.25)' } : {}}
                          >
                            {i.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
