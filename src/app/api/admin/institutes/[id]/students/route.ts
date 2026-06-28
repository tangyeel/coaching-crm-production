export const dynamic = 'force-dynamic'
import { db } from '@/lib/db'
import { auth, handle, json, HttpError } from '@/lib/api'

export const GET = handle(async (req, { params }: { params: { id: string } }) => {
  await auth(['SUPER_ADMIN'])
  const instId = params.id

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const perPage = Math.min(100, Math.max(1, Number(searchParams.get('perPage') ?? '10')))
  const search = searchParams.get('search')?.trim() || ''
  const filterStatus = searchParams.get('status') || 'all'

  let q = db.from('users_profile')
    .select('id, name, email, phone, is_active, created_at', { count: 'exact' })
    .eq('institute_id', instId)
    .eq('role', 'STUDENT')
    .is('deleted_at', null)
    .order('name')
    .range((page - 1) * perPage, page * perPage - 1)

  if (search) {
    q = q.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
  }
  if (filterStatus === 'active') {
    q = q.eq('is_active', true)
  } else if (filterStatus === 'inactive') {
    q = q.eq('is_active', false)
  }

  const [listRes, activeCountRes, inactiveCountRes] = await Promise.all([
    q,
    db.from('users_profile').select('id', { count: 'exact', head: true }).eq('institute_id', instId).eq('role', 'STUDENT').eq('is_active', true).is('deleted_at', null),
    db.from('users_profile').select('id', { count: 'exact', head: true }).eq('institute_id', instId).eq('role', 'STUDENT').eq('is_active', false).is('deleted_at', null),
  ])

  if (listRes.error) throw new HttpError(500, listRes.error.message)

  const studentsList = (listRes.data ?? []) as any[]
  const studentIds = studentsList.map(s => s.id)
  
  const { data: bsRows } = studentIds.length
    ? await db.from('batch_students').select('student_id, batch:batches(name)').in('student_id', studentIds)
    : { data: [] }

  const items = studentsList.map(s => {
    const enrollments = (bsRows ?? []).filter(bs => bs.student_id === s.id)
    const batchNames = enrollments.map((bs: any) => bs.batch?.name).filter(Boolean).join(', ') || 'None'
    return {
      id: s.id,
      name: s.name,
      course: 'General',
      batch: batchNames,
      phone: s.phone || '—',
      joined: new Date(s.created_at).toISOString().slice(0, 10),
      status: s.is_active ? 'active' : 'inactive',
      lastActive: 'Active',
    }
  })

  return json({
    items,
    total: listRes.count ?? 0,
    activeCount: activeCountRes.count ?? 0,
    inactiveCount: inactiveCountRes.count ?? 0,
    page,
    perPage
  })
})
