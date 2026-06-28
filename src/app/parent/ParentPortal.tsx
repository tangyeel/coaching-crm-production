'use client'

import PortalShell from '@/components/PortalShell'
import { NP } from '@/lib/portal-mock-data'

const titleMap: Record<string, { title: string; subtitle: string }> = {
  overview: { title: 'Dashboard', subtitle: 'Ward performance overview' },
  marks: { title: 'Marks', subtitle: 'Exam scores and grades' },
  attendance: { title: 'Attendance', subtitle: 'Attendance records' },
  fees: { title: 'Fees', subtitle: 'Invoices and payments' },
  announcements: { title: 'Announcements', subtitle: 'Institute announcements' },
  account: { title: 'Account', subtitle: 'Settings' },
}

export default function ParentPortal({ children, name }: { children: React.ReactNode; name: string }) {
  return (
    <PortalShell navItems={NP} role="parent" basePath="/parent" name={name} titleMap={titleMap}>
      {children}
    </PortalShell>
  )
}
