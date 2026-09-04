import { NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/supabase-server'
import { computeEarnings, DailyLog } from '@/lib/finance'

// HANDLES REQUESTS TO FETCH FINANCIAL LOGS FOR A SPECIFIC TIMEFRAME TO GENERATE A PDF REPORT
export async function GET(request: Request) {
  const { userId, supabase } = await getUserIdFromRequest(request)
  if (!userId || !supabase) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const fromDate = searchParams.get('from')
  const toDate = searchParams.get('to')

  try {
    // FETCH THE USER'S ACTIVE GOAL TO COMPUTE EARNINGS CORRECTLY
    const { data: goalData, error: goalError } = await supabase
      .from('goals')
      .select('daily_minutes, rate_per_minute')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle()

    if (goalError) throw goalError
    const dailyMinutes = goalData?.daily_minutes ?? 0
    const ratePerMinute = goalData?.rate_per_minute ?? 0.13

    // FETCH THE LOGS FILTERED BY THE DATE RANGE
    let query = supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', userId)
      .order('logged_on', { ascending: false })

    if (fromDate) {
      query = query.gte('logged_on', fromDate)
    }
    if (toDate) {
      query = query.lte('logged_on', toDate)
    }

    const { data: logsData, error: logsError } = await query
    if (logsError) throw logsError

    const logs: DailyLog[] = logsData ?? []

    // COMPUTE EARNINGS AND SUMMARIES
    const breakdown = computeEarnings(logs, dailyMinutes, ratePerMinute)
    const totalMinutes = logs.reduce((sum, l) => sum + l.minutes, 0)

    // GROUP LOGS BY DATE FOR A CLEANER TABLE IN THE PDF
    const byDate = new Map<string, { minutes: number; note: string | null }>()
    for (const l of logs) {
      const existing = byDate.get(l.logged_on)
      if (existing) {
        existing.minutes += l.minutes
        if (!existing.note && l.note) existing.note = l.note
      } else {
        byDate.set(l.logged_on, { minutes: l.minutes, note: l.note })
      }
    }

    // MAP TO ARRAY AND SORT BY DATE DESCENDING
    const entries = Array.from(byDate.entries())
      .map(([date, d]) => ({ date, minutes: d.minutes, note: d.note }))
      .sort((a, b) => b.date.localeCompare(a.date))

    return NextResponse.json({
      fromDate,
      toDate,
      totalMinutes,
      totalEarnings: breakdown.totalEarnings,
      entries,
    })
  } catch (error: any) {
    console.error('Error fetching download data:', error)
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}
