import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth, handle, instituteOf, HttpError } from '@/lib/api'

export const dynamic = 'force-dynamic'

export const GET = handle(async () => {
  // Only allow institute administrators to export the dataset
  const session = await auth(['INSTITUTE_ADMIN'])
  const instituteId = instituteOf(session)

  // Fetch all related records for the institute
  const [
    instRes,
    profilesRes,
    batchesRes,
    announcementsRes,
    invoicesRes,
    feePaymentsRes,
    attendanceRes
  ] = await Promise.all([
    db.from('institutes').select('name, plan, status, created_at').eq('id', instituteId).single(),
    db.from('users_profile').select('id, name, email, role, phone, guardian_name, guardian_phone, fee_status, is_active, created_at').eq('institute_id', instituteId),
    db.from('batches').select('*').eq('institute_id', instituteId),
    db.from('announcements').select('*').eq('institute_id', instituteId),
    db.from('invoices').select('*').eq('institute_id', instituteId),
    db.from('fee_payments').select('*').eq('institute_id', instituteId),
    db.from('attendance').select('*').eq('institute_id', instituteId)
  ])

  if (instRes.error) {
    throw new HttpError(500, 'Failed to query institute details')
  }

  const instData = instRes.data as any
  const exportPayload = {
    exportDate: new Date().toISOString(),
    institute: instData,
    profiles: profilesRes.data ?? [],
    batches: batchesRes.data ?? [],
    announcements: announcementsRes.data ?? [],
    invoices: invoicesRes.data ?? [],
    feePayments: feePaymentsRes.data ?? [],
    attendance: attendanceRes.data ?? []
  }

  const sanitizedName = (instData?.name || 'institute').toLowerCase().replace(/[^a-z0-9]/g, '_')
  const filename = `coachflow_export_${sanitizedName}_${new Date().toISOString().slice(0, 10)}.json`

  return new NextResponse(JSON.stringify(exportPayload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  })
})
