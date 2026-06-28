import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const secret = searchParams.get('secret')

    const cronSecret = process.env.CRON_SECRET ?? 'coachflow_default_cron_secret'
    if (secret !== cronSecret) {
      console.error('[CRON FEE REMINDERS] Unauthorized access attempt.')
      return new NextResponse('Unauthorized', { status: 401 })
    }

    console.log('[CRON FEE REMINDERS] Starting automated fee reminder queueing...')

    const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    
    // Find all invoices that are unpaid (status is NOT 'PAID')
    const { data: dueInvoices, error: invError } = await db
      .from('invoices')
      .select('*')
      .neq('status', 'PAID')

    if (invError) {
      console.error('[CRON FEE REMINDERS] Failed to query due invoices:', invError.message)
      return NextResponse.json({ success: false, error: invError.message }, { status: 500 })
    }

    if (!dueInvoices || dueInvoices.length === 0) {
      console.log('[CRON FEE REMINDERS] No due invoices found.')
      return NextResponse.json({ success: true, queued: 0 })
    }

    // Filter invoices due today or overdue
    const targets = dueInvoices.filter(inv => {
      const invDueDate = new Date(inv.due_date as string)
      const todayDate = new Date(today)
      // Due today or overdue
      return invDueDate <= todayDate
    })

    if (targets.length === 0) {
      console.log('[CRON FEE REMINDERS] No target invoices match due/overdue filter.')
      return NextResponse.json({ success: true, queued: 0 })
    }

    // Map student IDs
    const studentIds = [...new Set(targets.map(inv => inv.student_id))] as string[]
    
    // Fetch matching student profiles
    const { data: students, error: studError } = await db
      .from('users_profile')
      .select('id, name, guardian_phone')
      .in('id', studentIds)

    if (studError || !students) {
      console.error('[CRON FEE REMINDERS] Failed to fetch student profiles:', studError?.message)
      return NextResponse.json({ success: false, error: studError?.message }, { status: 500 })
    }

    let queuedCount = 0
    const queueRows = []

    for (const inv of targets) {
      const student = students.find(s => s.id === inv.student_id)
      if (!student || !student.guardian_phone) {
        console.warn(`[CRON FEE REMINDERS] Skipping invoice ${inv.id}: No student or guardian phone found.`)
        continue
      }

      // Check if we already queued a reminder for this invoice today to prevent spam
      const { data: alreadyQueued } = await db
        .from('notification_queue')
        .select('id')
        .eq('recipient', student.guardian_phone)
        .eq('type', 'FEE_REMINDER')
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (alreadyQueued) {
        // Already has a pending reminder, skip
        continue
      }

      queueRows.push({
        institute_id: inv.institute_id,
        recipient: student.guardian_phone,
        type: 'FEE_REMINDER',
        payload: JSON.stringify({
          studentName: student.name,
          amount: inv.total_amount,
          dueDate: inv.due_date,
          invoiceNumber: inv.id
        }),
        status: 'PENDING'
      })
      queuedCount++
    }

    if (queueRows.length > 0) {
      const { error: insErr } = await db.from('notification_queue').insert(queueRows)
      if (insErr) {
        console.error('[CRON FEE REMINDERS] Failed to insert into queue:', insErr.message)
        return NextResponse.json({ success: false, error: insErr.message }, { status: 500 })
      }
    }

    console.log(`[CRON FEE REMINDERS] Successfully queued ${queuedCount} fee reminders.`)
    return NextResponse.json({ success: true, queued: queuedCount })
  } catch (err: any) {
    console.error('[CRON FEE REMINDERS ERROR]:', err.message)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
