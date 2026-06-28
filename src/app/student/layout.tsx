import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import StudentPortal from './StudentPortal'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session || session.role !== 'STUDENT') redirect('/login')

  return <StudentPortal name={session.name}>{children}</StudentPortal>
}
