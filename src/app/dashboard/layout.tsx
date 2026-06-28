import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import Nav from '@/components/Nav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role === 'SUPER_ADMIN') redirect('/admin')
  if (session.role === 'STUDENT') redirect('/student')
  if (session.role === 'TEACHER') redirect('/institute')
  if (session.role === 'PARENT') redirect('/parent')
  if (session.role === 'INSTITUTE_ADMIN') redirect('/institute')
  
  return (
    <>
      <Nav role={session.role} name={session.name} />
      <main className="container">{children}</main>
    </>
  )
}
