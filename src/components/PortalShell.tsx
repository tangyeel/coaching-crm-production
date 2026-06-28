'use client'

import { usePathname, useRouter } from 'next/navigation'
import { NavItem } from '@/lib/portal-mock-data'
import '@/app/portal.css'

interface PortalShellProps {
  children: React.ReactNode
  navItems: NavItem[]
  role: string
  basePath: string
  name: string
  titleMap: Record<string, { title: string; subtitle: string }>
}

export default function PortalShell({ children, navItems, role, basePath, name, titleMap }: PortalShellProps) {
  const pathname = usePathname()
  const router = useRouter()

  const currentPage = pathname === basePath
    ? (navItems[0]?.id || 'overview')
    : pathname.replace(basePath + '/', '').split('/')[0] || navItems[0]?.id || 'overview'

  const currentTitle = titleMap[currentPage] || { title: '', subtitle: '' }

  const handleNav = (id: string) => {
    if (id === currentPage) return
    if (id === navItems[0]?.id) {
      router.push(basePath)
    } else {
      router.push(basePath + '/' + id)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {}
    window.location.href = '/login'
  }

  const getAvatarLetter = () => {
    return role === 'teacher' ? 'T' : role === 'student' ? 'S' : 'P'
  }

  return (
    <div className="portal" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <div className="bg-orb bg-orb-1"></div>
      <div className="bg-orb bg-orb-2"></div>
      <div className="dot-grid"></div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0, position: 'relative', zIndex: 10 }}>
        {/* Sidebar */}
        <aside className="sidebar">
          <div style={{ padding: '20px 20px 8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accd)' }}>
                <i className="fa-solid fa-bolt" style={{ color: 'var(--acc)', fontSize: 14 }}></i>
              </div>
              <div>
                <h1 style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>CoachFlow</h1>
                <p style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--t3)', margin: 0 }}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </p>
              </div>
            </div>
          </div>
          <div style={{ padding: '8px 12px', flex: 1, overflowY: 'auto' }}>
            <nav>
              {navItems.map(n => (
                <div
                  key={n.id}
                  className={'ni' + (n.id === currentPage ? ' active' : '')}
                  onClick={() => handleNav(n.id)}
                >
                  <i className={'fa-solid ' + n.icon}></i>
                  <span>{n.label}</span>
                </div>
              ))}
            </nav>
          </div>
          <div style={{ padding: '12px', marginTop: 'auto' }}>
            <div className="ni" onClick={handleLogout}>
              <i className="fa-solid fa-arrow-right-from-bracket"></i>
              <span>Logout</span>
            </div>
          </div>
        </aside>

        {/* Main area */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
          {/* Topbar */}
          <header className="topbar">
            <div>
              <h2 style={{ fontWeight: 700, fontSize: 18, margin: 0 }}>{currentTitle.title}</h2>
              <p style={{ fontSize: 11, marginTop: 2, color: 'var(--t3)', margin: 0 }}>{currentTitle.subtitle}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="sb">
                <i className="fa-solid fa-magnifying-glass" style={{ fontSize: 11, color: 'var(--t3)' }}></i>
                <input placeholder="Search..." aria-label="Search" />
              </div>
              <div
                style={{
                  width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', cursor: 'pointer', background: 'var(--bg3)', border: '1px solid var(--bdr)'
                }}
                onClick={() => {}}
              >
                <i className="fa-solid fa-bell" style={{ fontSize: 12, color: 'var(--t2)' }}></i>
              </div>
              <div
                style={{
                  width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
                  fontSize: 12, background: 'linear-gradient(135deg,var(--acc),#E08A12)', color: '#08080D'
                }}
              >
                {getAvatarLetter()}
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="ca">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
