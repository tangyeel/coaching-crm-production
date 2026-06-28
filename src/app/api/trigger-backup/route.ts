import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const cronSecret = process.env.CRON_SECRET

  if (!supabaseUrl) {
    console.error('Backup trigger failed: NEXT_PUBLIC_SUPABASE_URL is not configured.')
    return NextResponse.json({ success: false, error: 'Database URL not configured' }, { status: 500 })
  }

  console.log('Triggering weekly Supabase Edge Function backup...')
  const res = await fetch(
    `${supabaseUrl}/functions/v1/backup`,
    {
      headers: {
        'Authorization': `Bearer ${cronSecret || ''}`
      }
    }
  ).catch(err => {
    console.error('Backup trigger connection failed:', err)
    return null
  })
  
  if (!res || !res.ok) {
    console.error('Backup failed:', res ? await res.text() : 'Connection error or non-ok response')
    return NextResponse.json({ success: false, error: 'Backup execution failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
