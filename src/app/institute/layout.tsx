import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import InstitutePortal from './InstitutePortal'

export default async function InstituteLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session || (session.role !== 'INSTITUTE_ADMIN' && session.role !== 'TEACHER')) redirect('/login')

  return <InstitutePortal name={session.name} role={session.role}>{children}</InstitutePortal>
}
