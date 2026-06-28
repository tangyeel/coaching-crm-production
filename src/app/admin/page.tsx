'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { api } from '@/lib/client'
import { useRouter } from 'next/navigation'
import DashboardTab from '@/components/admin/DashboardTab'
import RevenueTab from '@/components/admin/RevenueTab'
import MessagesTab from '@/components/admin/MessagesTab'
import StudentsTab from '@/components/admin/StudentsTab'
import ManagementTab from '@/components/admin/ManagementTab'

import {
  Chart, LineController, BarController, DoughnutController,
  LineElement, BarElement, ArcElement, PointElement,
  CategoryScale, LinearScale, Filler, Tooltip, Legend,
} from 'chart.js'

Chart.register(
  LineController, BarController, DoughnutController,
  LineElement, BarElement, ArcElement, PointElement,
  CategoryScale, LinearScale, Filler, Tooltip, Legend,
)

Chart.defaults.color = '#8888A0'
Chart.defaults.borderColor = 'rgba(42,42,58,0.4)'
Chart.defaults.font.family = "'DM Sans', sans-serif"
Chart.defaults.font.size = 12
Chart.defaults.plugins.legend.labels.usePointStyle = true
Chart.defaults.plugins.legend.labels.pointStyleWidth = 8
Chart.defaults.plugins.tooltip.backgroundColor = '#1E1E2A'
Chart.defaults.plugins.tooltip.borderColor = '#2A2A3A'
Chart.defaults.plugins.tooltip.borderWidth = 1
Chart.defaults.plugins.tooltip.cornerRadius = 10
Chart.defaults.plugins.tooltip.padding = 12
Chart.defaults.plugins.tooltip.titleFont = { family: 'var(--font-space)', weight: 600, size: 13 }
Chart.defaults.plugins.tooltip.bodyFont = { family: "'DM Sans'", size: 12 }

function money(n: number) { return '₹' + n.toLocaleString('en-IN') }

function escapeHTML(str: string): string {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

interface Institute {
  id: string; name: string; email: string; phone: string; plan: string
  students: number; teachers: number; batches: number; revenue: number
  status: string; adminName: string; adminEmail: string; adminPhone?: string
  address?: string; monthlyFee: number; whatsappToken?: string; whatsappPhoneId?: string
  messages?: number
}

const emptyForm = {
  name: '', email: '', phone: '', plan: 'BASIC', monthlyFee: 0,
  whatsappToken: '', whatsappPhoneId: '',
  adminName: '', adminEmail: '', adminPassword: '',
}

export default function AdminPanel() {
  const router = useRouter()
  const [currentInstitute, setCurrentInstitute] = useState('')
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [instMenuOpen, setInstMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [analytics, setAnalytics] = useState<any>(null)
  const [institutes, setInstitutes] = useState<Institute[] | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [editingInstitute, setEditingInstitute] = useState<Institute | null>(null)

  const [instAnalytics, setInstAnalytics] = useState<any>(null)
  const [instStudents, setInstStudents] = useState<any[]>([])
  const [instActiveCount, setInstActiveCount] = useState(0)
  const [instInactiveCount, setInstInactiveCount] = useState(0)

  const contentRef = useRef<HTMLDivElement>(null)

  const load = useCallback(() => {
    api('/api/admin/analytics').then(setAnalytics).catch(() => { })
    api('/api/admin/institutes').then(setInstitutes).catch(() => { })
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (institutes && institutes.length > 0 && !currentInstitute) {
      const firstReal = institutes.find(i => i.status !== 'PENDING')
      if (firstReal) {
        setCurrentInstitute(firstReal.id)
      }
    }
  }, [institutes, currentInstitute])

  useEffect(() => {
    if (!currentInstitute) return
    setInstAnalytics(null)
    setInstStudents([])
    setInstActiveCount(0)
    setInstInactiveCount(0)
    Promise.all([
      api(`/api/admin/institutes/${currentInstitute}/analytics`),
      api(`/api/admin/institutes/${currentInstitute}/students?page=1&perPage=5000`)
    ]).then(([analyticsData, studentsData]) => {
      setInstAnalytics(analyticsData)
      setInstStudents(studentsData.items || [])
      setInstActiveCount(studentsData.activeCount || 0)
      setInstInactiveCount(studentsData.inactiveCount || 0)
    }).catch(err => {
      console.error('Failed to load institute details', err)
    })
  }, [currentInstitute])

  function selectInstitute(id: string) {
    if (id === currentInstitute) { setInstMenuOpen(false); return }
    if (contentRef.current) { contentRef.current.style.opacity = '0'; contentRef.current.style.transform = 'translateY(8px)' }
    setTimeout(() => {
      setCurrentInstitute(id); setInstMenuOpen(false)
      if (contentRef.current) { contentRef.current.style.opacity = '1'; contentRef.current.style.transform = 'translateY(0)' }
    }, 300)
  }

  async function onboard(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('')
    try {
      await api('/api/admin/institutes', { method: 'POST', body: JSON.stringify({ ...form, monthlyFee: Number(form.monthlyFee), phone: form.phone || undefined }) })
      setForm(emptyForm); load()
    } catch (err: any) { setError(err.message) }
    setBusy(false)
  }

  async function approveRequest(inst: Institute) { try { await api(`/api/admin/institutes/${inst.id}/approve`, { method: 'POST' }); load() } catch (err: any) { alert(err.message) } }
  async function rejectRequest(inst: Institute) { try { await api(`/api/admin/institutes/${inst.id}/reject`, { method: 'POST' }); load() } catch (err: any) { alert(err.message) } }

  async function recordPayment(inst: Institute) {
    const amount = prompt(`Record payment for ${inst.name}:`, String(inst.monthlyFee))
    if (!amount || isNaN(Number(amount))) return
    const month = prompt('For month (YYYY-MM):', new Date().toISOString().slice(0, 7))
    if (!month) return
    try { await api(`/api/admin/institutes/${inst.id}/payments`, { method: 'POST', body: JSON.stringify({ amount: Number(amount), periodMonth: month }) }); load() } catch (err: any) { alert(err.message) }
  }

  async function toggleStatus(inst: Institute) {
    const status = inst.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
    try { await api(`/api/admin/institutes/${inst.id}`, { method: 'PATCH', body: JSON.stringify({ status }) }); load() } catch (err: any) { alert(err.message) }
  }

  async function editInstitute(i: Institute) {
    setEditingInstitute(i)
  }

  async function logout() { await fetch('/api/auth/logout', { method: 'POST' }); window.location.href = '/login' }

  const displayedInstitutes = (institutes?.filter(i => i.status !== 'PENDING').map((i, idx) => ({
    id: i.id,
    name: i.name,
    short: i.name.split(' ')[0],
    color: ['#6C5CE7', '#00CEC9', '#FDCB6E', '#FF6B6B', '#74B9FF'][idx % 5],
    isReal: true,
    raw: i
  })) ?? [])

  const inst = displayedInstitutes.find(i => i.id === currentInstitute) || displayedInstitutes[0] || { id: '', name: 'No Institutes', short: 'None', color: '#8888A0' }

  const d = instAnalytics || {
    kpi: { revenue: 0, students: 0, messages: 0, conversion: 0, revChg: 0, stuChg: 0, msgChg: 0, convChg: 0 },
    revMonthly: Array.from({ length: 12 }, () => 0),
    revPrev: Array.from({ length: 12 }, () => 0),
    msgMonthly: Array.from({ length: 12 }, () => 0),
    stuMonthly: Array.from({ length: 12 }, () => 0),
    dist: {},
    courseRev: {},
    msgTypes: { SMS: 0, WhatsApp: 0, 'In-App': 0, Email: 0 },
    avgRespTime: '—',
    openRate: 0,
    respRate: 0,
    payMethods: { UPI: 0, Card: 0, 'Bank Transfer': 0, Cash: 0 },
    mrr: 0,
    arpu: 0,
    collRate: 0,
    activities: []
  }
  const set = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value })
  const pendingReqs = institutes?.filter(i => i.status === 'PENDING') ?? []

  const dbSizeBytes = analytics?.dbSize || 0
  const dbSizeMB = (dbSizeBytes / (1024 * 1024)).toFixed(2)
  const dbSizeLimitMB = 500
  const dbSizePct = Math.max(0.1, Math.min(100, Number((dbSizeBytes / (dbSizeLimitMB * 1024 * 1024)) * 100)))
  const dbSizePctStr = dbSizePct < 1 ? dbSizePct.toFixed(2) : dbSizePct.toFixed(1)

  return (
    <div className="dark-theme" style={{ height: '100vh', overflow: 'hidden' }}>
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="dot-grid" />

      <div style={{ display: 'flex', height: '100vh', position: 'relative', zIndex: 10 }}>
        {/* ─── SIDEBAR ─── */}
        <aside className="sidebar">
          <div style={{ padding: '24px 24px 8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-dim)' }}>
                <i className="fa-solid fa-bolt" style={{ color: 'var(--accent)', fontSize: 16 }}></i>
              </div>
              <div>
                <h1 style={{ fontFamily: 'var(--font-space)', fontWeight: 700, fontSize: 15, color: 'var(--text-1)', margin: 0 }}>CoachFlow</h1>
                <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', margin: 0 }}>CRM Platform</p>
              </div>
            </div>
          </div>

          <div style={{ padding: '12px 16px 8px' }}>
            <p className="section-label">Main Menu</p>
            {[
              { id: 'dashboard', icon: 'fa-solid fa-grid-2', label: 'Dashboard' },
              { id: 'revenue', icon: 'fa-solid fa-chart-line', label: 'Revenue' },
              { id: 'messages', icon: 'fa-solid fa-message', label: 'Messages' },
              { id: 'students', icon: 'fa-solid fa-users', label: 'Students' },
            ].map(item => (
              <div key={item.id} className={`nav-item ${currentPage === item.id ? 'active' : ''}`} onClick={() => setCurrentPage(item.id)}>
                <i className={item.icon}></i>
                <span>{item.label}</span>
              </div>
            ))}

            <p className="section-label" style={{ marginTop: 24 }}>System</p>
            <div className={`nav-item ${currentPage === 'management' ? 'active' : ''}`} onClick={() => setCurrentPage('management')}>
              <i className="fa-solid fa-sliders"></i>
              <span>Management</span>
            </div>
          </div>

          {/* Database quota usage */}
          <div style={{ marginTop: 'auto', padding: 20 }}>
            <div className="card-dim" style={{ padding: 14, borderRadius: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 6 }}>
                <span>DB Usage</span>
                <span>{dbSizePctStr}%</span>
              </div>
              <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden', marginBottom: 8 }}>
                <div style={{ width: `${dbSizePct}%`, height: '100%', background: dbSizePct > 90 ? 'var(--danger)' : dbSizePct > 75 ? 'var(--accent)' : 'var(--success)', borderRadius: 2 }} />
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-2)', margin: 0 }}>{dbSizeMB} MB of {dbSizeLimitMB} MB</p>
            </div>
            <button className="nav-item outline" onClick={logout} style={{ width: '100%', marginTop: 12, justifyContent: 'center' }}>
              <i className="fa-solid fa-right-from-bracket"></i>
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* ─── MAIN PORT ─── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
          {/* ─── HEADER ─── */}
          <header className="header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <h2 style={{ fontFamily: 'var(--font-space)', fontWeight: 700, fontSize: 18, color: 'var(--text-1)', margin: 0, textTransform: 'capitalize' }}>{currentPage}</h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginLeft: 'auto' }}>
              <div className="search-box">
                <i className="fa-solid fa-magnifying-glass" style={{ color: 'var(--text-3)', fontSize: 12 }}></i>
                <input type="text" placeholder="Search anything..." aria-label="Search" />
              </div>

              {/* Institute Dropdown */}
              <div style={{ position: 'relative' }}>
                <div className="inst-trigger" onClick={() => setInstMenuOpen(!instMenuOpen)}>
                  <span className="dot" style={{ background: inst.color }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', margin: 0 }} className="truncate">{inst.name}</p>
                  </div>
                  <i className="fa-solid fa-chevron-down" style={{ color: 'var(--text-3)', fontSize: 10, transition: 'transform .25s', transform: instMenuOpen ? 'rotate(180deg)' : '' }}></i>
                </div>
                <div className={`inst-menu ${instMenuOpen ? 'open' : ''}`}>
                  {displayedInstitutes.map(instOpt => {
                    const studentsCount = (instOpt as any).raw.students
                    return (
                      <div key={instOpt.id} className={`inst-option ${instOpt.id === currentInstitute ? 'selected' : ''}`} onClick={() => selectInstitute(instOpt.id)}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: instOpt.color, flexShrink: 0, display: 'inline-block' }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', margin: 0 }}>{instOpt.name}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0 }}>{studentsCount} students</p>
                        </div>
                        <span style={{ marginLeft: 'auto', color: 'var(--accent)', opacity: instOpt.id === currentInstitute ? 1 : 0 }}><i className="fa-solid fa-check"></i></span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Notifications */}
              <div style={{ position: 'relative' }}>
                <div onClick={() => setNotifOpen(!notifOpen)} style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-3)', border: '1px solid var(--border)', cursor: 'pointer', position: 'relative' }}>
                  <i className="fa-regular fa-bell" style={{ color: 'var(--text-2)', fontSize: 14 }}></i>
                  <span style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: 'var(--danger)', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</span>
                </div>
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 340, background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 14, padding: 8, boxShadow: '0 20px 60px rgba(0,0,0,.5)', zIndex: 100, opacity: notifOpen ? 1 : 0, transform: notifOpen ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(.97)', pointerEvents: notifOpen ? 'auto' : 'none', transition: 'all .25s ease' }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', padding: '4px 8px', margin: 0 }}>Notifications</p>
                  {[
                    { icon: 'fa-solid fa-check', bg: 'var(--success-dim)', color: 'var(--success)', title: 'Payment received', desc: 'Rs 45,000 from Amit Kumar — 2m ago' },
                    { icon: 'fa-solid fa-plus', bg: 'var(--accent-dim)', color: 'var(--accent)', title: 'New enrollment', desc: 'Sneha Reddy joined NEET batch — 15m ago' },
                    { icon: 'fa-solid fa-paper-plane', bg: 'var(--info-dim)', color: 'var(--info)', title: 'Message broadcast complete', desc: 'Sent to 250 students — 1h ago' },
                  ].map((n, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }} className="notif-item">
                      <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: n.bg }}>
                        <i className={n.icon} style={{ color: n.color, fontSize: 12 }}></i>
                      </div>
                      <div>
                        <p style={{ fontSize: 13, color: 'var(--text-1)', margin: 0 }}>{n.title}</p>
                        <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>{n.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Avatar */}
              <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-space)', fontWeight: 700, fontSize: 14, cursor: 'pointer', background: 'linear-gradient(135deg,var(--accent),#E08A12)', color: '#08080D' }}>A</div>
            </div>
          </header>

          {/* ─── CONTENT ─── */}
          <main className="content-area" id="content-area" ref={contentRef}>
            {currentPage === 'dashboard' && (
              <DashboardTab d={d} escapeHTML={escapeHTML} />
            )}

            {currentPage === 'revenue' && (
              <RevenueTab d={d} escapeHTML={escapeHTML} money={money} />
            )}

            {currentPage === 'messages' && (
              <MessagesTab d={d} escapeHTML={escapeHTML} instStudents={instStudents} />
            )}

            {currentPage === 'students' && (
              <StudentsTab
                students={instStudents}
                activeCount={instActiveCount}
                inactiveCount={instInactiveCount}
                totalStudentsKPI={d.kpi.students}
                totalStudentsKPIChg={d.kpi.stuChg}
                escapeHTML={escapeHTML}
              />
            )}

            {currentPage === 'management' && (
              <ManagementTab
                form={form}
                set={set}
                busy={busy}
                onboard={onboard}
                error={error}
                pendingReqs={pendingReqs}
                approveRequest={approveRequest}
                rejectRequest={rejectRequest}
                institutes={institutes}
                analytics={analytics}
                recordPayment={recordPayment}
                editInstitute={editInstitute}
                toggleStatus={toggleStatus}
                money={money}
              />
            )}
          </main>
        </div>
      </div>

      {editingInstitute && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(5, 5, 8, 0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 999, padding: 20
        }}>
          <div className="card" style={{
            width: '100%', maxWidth: 580, padding: 24,
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            border: '1px solid var(--border)',
            position: 'relative'
          }}>
            <h3 style={{ fontFamily: 'var(--font-space)', fontWeight: 600, fontSize: 18, color: 'var(--text-1)', margin: '0 0 16px 0' }}>Edit Institute Details</h3>
            <form onSubmit={async (e) => {
              e.preventDefault()
              setBusy(true)
              try {
                await api(`/api/admin/institutes/${editingInstitute.id}`, {
                  method: 'PATCH',
                  body: JSON.stringify({
                    name: editingInstitute.name,
                    email: editingInstitute.email,
                    phone: editingInstitute.phone || null,
                    address: editingInstitute.address || null,
                    plan: editingInstitute.plan,
                    monthlyFee: Number(editingInstitute.monthlyFee),
                    whatsappToken: editingInstitute.whatsappToken || null,
                    whatsappPhoneId: editingInstitute.whatsappPhoneId || null,
                  })
                })
                setEditingInstitute(null)
                load()
              } catch (err: any) {
                alert(err.message)
              }
              setBusy(false)
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="fl" style={{ display: 'block', fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Institute Name</label>
                  <input style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-1)', outline: 'none' }} value={editingInstitute.name} onChange={e => setEditingInstitute({...editingInstitute, name: e.target.value})} required />
                </div>
                <div>
                  <label className="fl" style={{ display: 'block', fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Institute Email</label>
                  <input type="email" style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-1)', outline: 'none' }} value={editingInstitute.email} onChange={e => setEditingInstitute({...editingInstitute, email: e.target.value})} required />
                </div>
                <div>
                  <label className="fl" style={{ display: 'block', fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Phone</label>
                  <input style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-1)', outline: 'none' }} value={editingInstitute.phone || ''} onChange={e => setEditingInstitute({...editingInstitute, phone: e.target.value})} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="fl" style={{ display: 'block', fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Address</label>
                  <input style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-1)', outline: 'none' }} value={editingInstitute.address || ''} onChange={e => setEditingInstitute({...editingInstitute, address: e.target.value})} />
                </div>
                <div>
                  <label className="fl" style={{ display: 'block', fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Plan</label>
                  <select style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-1)', outline: 'none', cursor: 'pointer' }} value={editingInstitute.plan} onChange={e => setEditingInstitute({...editingInstitute, plan: e.target.value})}>
                    <option value="BASIC">Basic</option>
                    <option value="PRO">Pro</option>
                    <option value="ENTERPRISE">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="fl" style={{ display: 'block', fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Monthly Fee (₹)</label>
                  <input type="number" min={0} style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-1)', outline: 'none' }} value={editingInstitute.monthlyFee} onChange={e => setEditingInstitute({...editingInstitute, monthlyFee: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="fl" style={{ display: 'block', fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>WhatsApp Token</label>
                  <input type="password" style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-1)', outline: 'none' }} value={editingInstitute.whatsappToken || ''} onChange={e => setEditingInstitute({...editingInstitute, whatsappToken: e.target.value})} placeholder="Meta Graph API Token" />
                </div>
                <div>
                  <label className="fl" style={{ display: 'block', fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>WhatsApp Phone ID</label>
                  <input style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-1)', outline: 'none' }} value={editingInstitute.whatsappPhoneId || ''} onChange={e => setEditingInstitute({...editingInstitute, whatsappPhoneId: e.target.value})} placeholder="Meta Phone Number ID" />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" className="btn outline" onClick={() => setEditingInstitute(null)}>Cancel</button>
                <button type="submit" className="btn" disabled={busy}>{busy ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
