'use client'

import PortalShell from '@/components/PortalShell'
import { NA, NT } from '@/lib/portal-mock-data'

const titleMap: Record<string, { title: string; subtitle: string }> = {
  overview: { title: 'Overview', subtitle: 'Performance at a glance' },
  students: { title: 'Students', subtitle: 'Enrollment and records' },
  teachers: { title: 'Teachers', subtitle: 'Teaching staff' },
  batches: { title: 'Batches', subtitle: 'Class batches' },
  attendance: { title: 'Attendance', subtitle: 'Track attendance' },
  fees: { title: 'Fees', subtitle: 'Payments and records' },
  marks: { title: 'Marks', subtitle: 'Exam scores' },
  reports: { title: 'Reports', subtitle: 'Analytics' },
  announcements: { title: 'Announcements', subtitle: 'Publish and view' },
  account: { title: 'Account', subtitle: 'Settings' },
}

export default function InstitutePortal({ children, name, role }: { children: React.ReactNode; name: string; role: string }) {
  const navItems = role === 'TEACHER' ? NT : NA
  return (
    <PortalShell navItems={navItems} role={role === 'TEACHER' ? 'teacher' : 'admin'} basePath="/institute" name={name} titleMap={titleMap}>
      {children}
    </PortalShell>
  )
}
