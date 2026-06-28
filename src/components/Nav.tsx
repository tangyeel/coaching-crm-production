'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

export default function Nav({ role, name }: { role: string; name: string }) {
  const pathname = usePathname()
  const router = useRouter()

  const links = role === 'PARENT' 
    ? [
        { href: '/parent', label: 'Dashboard' },
      ]
    : [
    { href: '/dashboard', label: 'Overview' },
    { href: '/dashboard/batches', label: 'Batches' },
    ...(role !== 'STUDENT'
      ? [
          { href: '/dashboard/teachers', label: 'Teachers' },
          { href: '/dashboard/students', label: 'Students' },
          { href: '/dashboard/fees', label: 'Fees' },
          { href: '/dashboard/attendance', label: 'Attendance' },
          { href: '/dashboard/marks', label: 'Marks' },
          { href: '/dashboard/reports', label: 'Reports' },
        ]
      : []),
    { href: '/dashboard/announcements', label: 'Announcements' },
    { href: '/dashboard/account', label: 'Account' },
  ]

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="topnav">
      <Link className="brand" href="/dashboard">CoachOS</Link>
      {links.map((l) => (
        <Link key={l.href} href={l.href} className={isActive(l.href) ? 'active' : ''}>
          {l.label}
        </Link>
      ))}
      <span className="spacer" />
      <span className="whoami">{name}</span>
      <button className="btn ghost sm" onClick={logout}>Logout</button>
    </nav>
  )
}
