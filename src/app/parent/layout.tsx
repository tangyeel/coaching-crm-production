import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import ParentPortal from './ParentPortal'

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session || session.role !== 'PARENT') redirect('/login')

  return <ParentPortal name={session.name}>{children}</ParentPortal>
}
