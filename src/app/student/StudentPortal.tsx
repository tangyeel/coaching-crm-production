'use client'

import PortalShell from '@/components/PortalShell'
import { NS } from '@/lib/portal-mock-data'

const titleMap: Record<string, { title: string; subtitle: string }> = {
  overview: { title: 'Dashboard', subtitle: 'Your performance at a glance' },
  performance: { title: 'Performance', subtitle: 'Your scores and grades' },
  attendance: { title: 'Attendance', subtitle: 'Your attendance records' },
  batches: { title: 'My Batches', subtitle: 'Class batches' },
  announcements: { title: 'Announcements', subtitle: 'Institute announcements' },
  account: { title: 'Account', subtitle: 'Settings' },
}

export default function StudentPortal({ children, name }: { children: React.ReactNode; name: string }) {
  return (
    <PortalShell navItems={NS} role="student" basePath="/student" name={name} titleMap={titleMap}>
      {children}
    </PortalShell>
  )
}
