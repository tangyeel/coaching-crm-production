export const dynamic = 'force-dynamic'
import { db } from '@/lib/db'
import { auth, handle, instituteOf, json } from '@/lib/api'

export const GET = handle(async () => {
  const session = await auth()
  if (session.role === 'SUPER_ADMIN') {
    const [instRes, payRes] = await Promise.all([
      db.from('institutes').select('id', { count: 'exact', head: true }),
      db.from('payments').select('amount'),
    ])
    return json({
      superAdmin: true,
      institutes: instRes.count ?? 0,
      revenue: (payRes.data ?? []).reduce((s, p) => s + Number(p.amount), 0)
    })
  }

  const instituteId = instituteOf(session)
  const today = new Date().toISOString().slice(0, 10)
  const weekAgo = new Date(Date.now() - 6 * 864e5).toISOString().slice(0, 10)

  // Run all 7 dashboard database queries in parallel
  const [
    studentsRes,
    teachersRes,
    batchesRes,
    announcementsRes,
    instRes,
    todayAtt,
    weekAtt
  ] = await Promise.all([
    db.from('users_profile').select('id', { count: 'exact', head: true }).eq('institute_id', instituteId).eq('role', 'STUDENT'),
    db.from('users_profile').select('id', { count: 'exact', head: true }).eq('institute_id', instituteId).eq('role', 'TEACHER'),
    db.from('batches').select('id', { count: 'exact', head: true }).eq('institute_id', instituteId),
    db.from('announcements').select('id, title, body, created_at, batch_id, batch:batches(name)').eq('institute_id', instituteId).order('created_at', { ascending: false }).limit(5),
    db.from('institutes').select('plan').eq('id', instituteId).single(),
    db.from('attendance').select('id', { count: 'exact', head: true }).eq('institute_id', instituteId).eq('date', today).eq('status', 'PRESENT'),
    db.from('attendance').select('date, status, batch_id').eq('institute_id', instituteId).gte('date', weekAgo).limit(5000),
  ])

  const presentToday = todayAtt.count ?? 0
  const recentAtt = weekAtt.data ?? []

  const trend = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10)
    const day = recentAtt.filter(r => r.date === d)
    trend.push({
      date: d.slice(5),
      present: day.filter(r => r.status === 'PRESENT').length,
      late: day.filter(r => r.status === 'LATE').length,
      absent: day.filter(r => r.status === 'ABSENT').length,
    })
  }

  return json({
    students: studentsRes.count ?? 0,
    teachers: teachersRes.count ?? 0,
    batches: batchesRes.count ?? 0,
    presentToday,
    plan: instRes.data?.plan ?? 'BASIC',
    trend,
    recentAtt,
    announcements: (announcementsRes.data ?? []).map((a: any) => ({
      id: a.id,
      title: a.title,
      body: a.body,
      createdAt: a.created_at,
      batch: a.batch ? { name: a.batch.name } : null,
    })),
  }, 200, { 'Cache-Control': 'private, max-age=10, stale-while-revalidate=5' })
})
