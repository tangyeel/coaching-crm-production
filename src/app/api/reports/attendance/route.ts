export const dynamic = 'force-dynamic'
import { db } from '@/lib/db'
import { auth, csvResponse, handle, instituteOf, json, HttpError } from '@/lib/api'

export const GET = handle(async (req) => {
  const session = await auth(['INSTITUTE_ADMIN', 'TEACHER'])
  const instituteId = instituteOf(session)
  const url = new URL(req.url)
  const batchId = url.searchParams.get('batchId')
  if (!batchId) throw new HttpError(400, 'batchId is required')

  const { data: batch, error: batchErr } = await db
    .from('batches')
    .select('id, name')
    .eq('id', batchId)
    .eq('institute_id', instituteId)
    .maybeSingle()
  
  if (batchErr || !batch) throw new HttpError(404, 'Batch not found')

  const [bsRes, attRes] = await Promise.all([
    db.from('batch_students').select('student_id').eq('batch_id', batchId).limit(500),
    db.from('attendance').select('student_id, status').eq('batch_id', batchId).limit(5000),
  ])

  const studentIds = (bsRes.data ?? []).map(bs => bs.student_id)
  const { data: profiles } = studentIds.length > 0
    ? await db.from('users_profile').select('id, name').in('id', studentIds).limit(500)
    : { data: [] }

  const rows = (bsRes.data ?? []).map(bs => {
    const name = (profiles ?? []).find(p => p.id === bs.student_id)?.name ?? ''
    const recs = (attRes.data ?? []).filter(a => a.student_id === bs.student_id)
    const present = recs.filter(a => a.status === 'PRESENT').length
    const late = recs.filter(a => a.status === 'LATE').length
    const absent = recs.filter(a => a.status === 'ABSENT').length
    const total = recs.length
    return {
      studentId: bs.student_id,
      name,
      present,
      late,
      absent,
      total,
      percentage: total > 0 ? Math.round(((present + late) / total) * 100) : null
    }
  })

  if (url.searchParams.get('format') === 'csv') {
    return csvResponse(`attendance-${batch.name}.csv`, [
      ['Student', 'Present', 'Late', 'Absent', 'Total Sessions', 'Attendance %'],
      ...rows.map(r => [r.name, r.present, r.late, r.absent, r.total, r.percentage ?? 'N/A'] as (string | number)[]),
    ])
  }
  return json({ batch: { id: batch.id, name: batch.name }, rows })
})
