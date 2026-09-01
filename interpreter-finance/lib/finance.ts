export type FinanceEntry = {
  date: string
  minutes: number
}

export type DailyLog = {
  id: string
  user_id: string
  logged_on: string
  minutes: number
  note: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type Goal = {
  id: string
  user_id: string
  daily_minutes: number
  work_hours: number
  starts_on: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type Profile = {
  id: string
  first_name: string
  last_name: string
  email: string
  timezone: string
  created_at: string
  updated_at: string
}

export type WeekData = { week: string; actual: number; goal: number }
export type ChartPoint = { day: number; minutes: number; goal: number }
export type CalendarDay = { day: number; minutes: number }
export type RecentEntry = { date: string; minutes: number; note: string }


// HOISTED INTL FORMATTERS TO AVOID REBUILDING ON EACH CALL
const monthYearFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
const longDateFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
const shortDateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })


// CONVERTS MINUTES INTO A HUMAN-READABLE STRING WITH HOURS AND MINUTES
export const formatMinutes = (minutes: number) => {
  const h = Math.floor(minutes / 60)
  const m = Number((minutes % 60).toFixed(2))
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}
export const defaultWorkHours = 15
export const goalMinutes = 0


// RETURNS TODAY'S DATE AS A YYYY-MM-DD STRING IN LOCAL TIMEZONE
export function localToday() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}


// RETURNS THE CURRENT MONTH AS A YYYY-MM STRING IN LOCAL TIMEZONE
export function localMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}


// CALCULATES THE REQUIRED MINUTES PER HOUR TO MEET A DAILY GOAL GIVEN WORK HOURS
export function getMinutesPerHour(goal: number, workHours = defaultWorkHours) {
  if (workHours <= 0) return 0
  return Number((goal / workHours).toFixed(1))
}

export function getWholeMinutesPerHour(goal: number, workHours = defaultWorkHours) {
  if (workHours <= 0) return 0
  return Math.ceil(goal / workHours)
}


// COMPUTES THE COMPLETION PERCENTAGE OF MINUTES AGAINST A DAILY GOAL
export function getProgress(minutes: number, goal = goalMinutes) {
  if (goal === 0) return minutes > 0 ? 100 : 0
  return Math.min(Math.round((minutes / goal) * 100), 100)
}


// RETURNS A TIME-OF-DAY GREETING BASED ON THE CURRENT HOUR
export function getGreeting() {
  const hour = new Date().getHours()
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
}

function monthName(monthIndex?: number) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  return months[monthIndex ?? new Date().getMonth()]
}

export function getMonthTitle() {
  return monthYearFormatter.format(new Date())
}


// GENERATES A MOTIVATIONAL SUMMARY MESSAGE BASED ON MONTHLY PERFORMANCE AND GOAL PROGRESS
export function getSummaryMessage(monthTotal: number, goalMinutes: number, completedDays: number, totalDays: number) {
  if (completedDays === 0) return 'Start your streak today.'
  const avg = Math.round(monthTotal / Math.max(completedDays, 1))
  if (avg >= goalMinutes) return 'You are building a strong rhythm. Keep the momentum going.'
  if (avg >= goalMinutes * 0.7) return 'Great pace, you are close to your daily goal.'
  return 'Consistency is key. Every minute counts.'
}


// CALCULATES THE PERCENTAGE CHANGE BETWEEN CURRENT AND PREVIOUS MONTH TOTALS
export function getWeekDelta(monthTotal: number, prevMonthTotal: number) {
  if (prevMonthTotal === 0) return '+0%'
  const delta = ((monthTotal - prevMonthTotal) / prevMonthTotal * 100)
  return `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`
}


// COMPUTES AGGREGATE MONTHLY STATISTICS INCLUDING TOTALS, AVERAGES, AND GOAL HIT RATES
export function computeMonthStats(logs: DailyLog[], goal: number) {
  const monthTotal = logs.reduce((sum, l) => sum + l.minutes, 0)
  const days = logs.length || 1
  const monthAverage = Math.round(monthTotal / days)
  const completedDays = logs.filter((l) => goal > 0 ? l.minutes >= goal : l.minutes > 0).length
  const goalHitRate = logs.length > 0 ? Math.round((completedDays / logs.length) * 100) : 0
  const goalProgress = (logs.length > 0 && goal > 0) ? Math.round((monthTotal / (goal * logs.length)) * 100) : (monthTotal > 0 ? 100 : 0)
  return { monthTotal, monthAverage, goalHitRate, goalProgress, completedDays }
}

function parseLocalDate(dateStr: string) {
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}


// BUILDS CHART DATA POINTS FROM RECENT LOGS, ZEROING OUT VALUES WHEN TODAY'S GOAL IS REACHED
export function buildChartData(logs: DailyLog[], goal: number): ChartPoint[] {
  const recentLogs = [...logs].slice(0, 14).reverse()

  const today = localToday()
  const todayLog = logs.find((l) => l.logged_on === today)
  const goalReached = todayLog && todayLog.minutes >= goal && goal > 0

  const points = recentLogs.map((l) => ({
    day: parseLocalDate(l.logged_on).getDate(),
    minutes: goalReached ? 0 : l.minutes,
    goal: goalReached ? 0 : goal
  }))

  if (points.length === 1) {
    const d = parseLocalDate(recentLogs[0].logged_on)
    d.setDate(d.getDate() - 1)
    points.unshift({ day: d.getDate(), minutes: goalReached ? 0 : 0, goal: goalReached ? 0 : goal })
  } else if (points.length === 0) {
    points.push({ day: new Date().getDate(), minutes: goalReached ? 0 : 0, goal: goalReached ? 0 : goal })
  }

  return points
}


// BUILDS CALENDAR DATA AGGREGATING MINUTES PER DAY FOR THE CURRENT MONTH
export function buildCalendarData(logs: DailyLog[]): CalendarDay[] {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`
  const logMap = new Map<number, number>()
  logs.forEach((l) => {
    if (l.logged_on.startsWith(monthKey)) {
      const d = parseLocalDate(l.logged_on)
      logMap.set(d.getDate(), (logMap.get(d.getDate()) ?? 0) + l.minutes)
    }
  })
  return Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, minutes: logMap.get(i + 1) ?? 0 }))
}


// GROUPS DAILY LOGS INTO WEEKLY BUCKETS WITH ACTUAL AND GOAL MINUTES
export function buildWeeklyData(logs: DailyLog[], goal: number): WeekData[] {
  const weeks: Record<string, { actual: number; goal: number }> = {}
  logs.forEach((l) => {
    const d = parseLocalDate(l.logged_on)
    const key = `W${Math.ceil(d.getDate() / 7)}`
    if (!weeks[key]) weeks[key] = { actual: 0, goal }
    weeks[key].actual += l.minutes
  })
  return Object.entries(weeks).map(([week, data]) => ({ week, actual: data.actual, goal: data.goal }))
}


// BUILD A LIST OF RECENT ENTRIES WITH HUMAN-READABLE DATE LABELS AND NOTES
export function buildRecentEntries(logs: DailyLog[]): RecentEntry[] {
  const today = localToday()
  const yd = new Date()
  yd.setDate(yd.getDate() - 1)
  const yesterday = `${yd.getFullYear()}-${String(yd.getMonth() + 1).padStart(2, '0')}-${String(yd.getDate()).padStart(2, '0')}`
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return logs
    .sort((a, b) => b.logged_on.localeCompare(a.logged_on))
    .map((l) => {
      const note = l.note || 'Daily practice'
      if (l.logged_on === today) return { date: 'Today, ' + monthName(), minutes: l.minutes, note }
      if (l.logged_on === yesterday) return { date: 'Yesterday, ' + monthName(), minutes: l.minutes, note }
      const d = parseLocalDate(l.logged_on)
      return { date: `${dayNames[d.getDay()]}, ${monthName(d.getMonth())} ${d.getDate()}`, minutes: l.minutes, note }
    })
}


export function sumMinutes(entries: FinanceEntry[]) { return entries.reduce((sum, item) => sum + item.minutes, 0) }

export function dateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` }

export function formatLongDate(date: string) { return longDateFormatter.format(new Date(`${date}T12:00:00`)) }

export type EarningsBreakdown = {
  todayEarnings: number
  weekEarnings: number
  monthEarnings: number
  yearEarnings: number
  totalEarnings: number
  qualifiedDays: { date: string; minutes: number; note: string | null; earnings: number; qualified: boolean }[]
}


// COMPUTES EARNINGS BREAKDOWN ONLY FOR DAYS WHERE THE DAILY GOAL WAS MET
export function computeEarnings(logs: DailyLog[], goal: number, ratePerMinute: number): EarningsBreakdown {
  const earn = (minutes: number) => Number((minutes * ratePerMinute).toFixed(2))
  const today = localToday()
  const qualifies = (l: DailyLog) => {
    if (goal > 0) {
      return l.minutes >= goal || l.logged_on < today
    }
    return l.minutes > 0
  }

  const month = localMonth()
  const year = String(new Date().getFullYear())

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 6)
  const weekStart = dateKey(weekAgo)

  const qualified = logs.filter(qualifies)

  const todayLogs = logs.filter((l) => l.logged_on === today)
  const todayEarnings = todayLogs.filter(qualifies).reduce((s, l) => s + earn(l.minutes), 0)
  const weekEarnings = qualified.filter((l) => l.logged_on >= weekStart && l.logged_on <= today).reduce((s, l) => s + earn(l.minutes), 0)
  const monthEarnings = qualified.filter((l) => l.logged_on.startsWith(month)).reduce((s, l) => s + earn(l.minutes), 0)
  const yearEarnings = qualified.filter((l) => l.logged_on.startsWith(year)).reduce((s, l) => s + earn(l.minutes), 0)
  const totalEarnings = qualified.reduce((s, l) => s + earn(l.minutes), 0)

  const qualifiedDays = (() => {
    const byDate = new Map<string, { minutes: number; note: string | null }>()
    for (const l of [...logs].sort((a, b) => b.logged_on.localeCompare(a.logged_on))) {
      const existing = byDate.get(l.logged_on)
      if (existing) {
        existing.minutes += l.minutes
        if (!existing.note && l.note) existing.note = l.note
      } else {
        byDate.set(l.logged_on, { minutes: l.minutes, note: l.note })
      }
    }
    return [...byDate.entries()]
      .slice(0, 14)
      .map(([date, d]) => ({ date, minutes: d.minutes, note: d.note, earnings: earn(d.minutes), qualified: d.minutes >= goal || date < today }))
  })()

  return { todayEarnings, weekEarnings, monthEarnings, yearEarnings, totalEarnings, qualifiedDays }
}
