import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseSSR } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  // Auth check — admin only
  const supabase = await createSupabaseSSR()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from') // yyyy-MM-dd
  const to = searchParams.get('to')     // yyyy-MM-dd

  if (!from || !to) {
    return NextResponse.json({ error: 'from and to query params are required' }, { status: 400 })
  }

  const personalApiKey = process.env.POSTHOG_PERSONAL_API_KEY
  const projectId = process.env.POSTHOG_PROJECT_ID
  const apiHost = process.env.POSTHOG_API_HOST ?? 'https://us.posthog.com'

  if (!personalApiKey || !projectId) {
    return NextResponse.json({ error: 'PostHog not configured (POSTHOG_PERSONAL_API_KEY / POSTHOG_PROJECT_ID missing)' }, { status: 503 })
  }

  const hogqlQuery = `
    SELECT
      toDate(timestamp) AS date,
      count()           AS pageviews,
      count(DISTINCT person_id) AS unique_visitors
    FROM events
    WHERE event = '$pageview'
      AND toDate(timestamp) >= '${from}'
      AND toDate(timestamp) <= '${to}'
    GROUP BY date
    ORDER BY date ASC
  `

  const res = await fetch(`${apiHost}/api/projects/${projectId}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${personalApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: { kind: 'HogQLQuery', query: hogqlQuery } }),
  })

  if (!res.ok) {
    const text = await res.text()
    return NextResponse.json({ error: `PostHog API error: ${text}` }, { status: res.status })
  }

  const json = await res.json()
  // results is an array of [date, pageviews, unique_visitors]
  const rows: { date: string; pageviews: number; unique_visitors: number }[] =
    (json.results ?? []).map(([date, pageviews, unique_visitors]: [string, number, number]) => ({
      date,
      pageviews,
      unique_visitors,
    }))

  return NextResponse.json({ rows })
}
