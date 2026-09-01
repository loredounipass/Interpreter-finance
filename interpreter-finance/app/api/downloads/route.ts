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
  const period = searchParams.get('period') || 'month'

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

    // BUILD THE START DATE FILTER BASED ON THE REQUESTED PERIOD
    const now = new Date()
    let startDateStr = ''

    if (period === 'day') {
      startDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    } else if (period === 'week') {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 6)
      startDateStr = `${weekAgo.getFullYear()}-${String(weekAgo.getMonth() + 1).padStart(2, '0')}-${String(weekAgo.getDate()).padStart(2, '0')}`
    } else if (period === 'month') {
      startDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    } else if (period === 'year') {
      startDateStr = `${now.getFullYear()}-01-01`
    }

    // FETCH THE LOGS FILTERED BY THE START DATE (OR ALL IF PERIOD IS NOT RECOGNIZED OR 'ALL')
    let query = supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', userId)
      .order('logged_on', { ascending: false })

    if (startDateStr) {
      query = query.gte('logged_on', startDateStr)
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
      period,
      totalMinutes,
      totalEarnings: breakdown.totalEarnings,
      entries,
    })
  } catch (error: any) {
    console.error('Error fetching download data:', error)
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}
