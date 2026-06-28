import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'

export default async function SignupLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (session) {
    if (session.role === 'SUPER_ADMIN') redirect('/admin')
    if (session.role === 'PARENT') redirect('/parent')
    redirect('/dashboard')
  }
  return <>{children}</>
}
