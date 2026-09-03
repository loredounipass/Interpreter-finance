export type FinanceEntry = {
  date: string
  minutes: number
}

export type DailyLog = {
  id: string
  user_id: string
  logged_on: string
  minutes: number
  earnings?: number
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
  rate_per_minute?: number
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
export type ChartPoint = { day: number; minutes: number; goal: number; label?: string }
export type CalendarDay = { day: number; minutes: number; goalMet: boolean; hasEarnings: boolean }
export type RecentEntry = { dateKey: string; date: string; minutes: number; note: string }
export type ChartPage = { points: ChartPoint[]; page: number; totalPages: number; dateRange: string }


// RESOLVES THE GOAL THAT WAS ACTIVE ON A GIVEN DATE BY WALKING THE GOAL TIMELINE
// Goals must be sorted by starts_on ascending. Returns the daily_minutes of the last goal whose starts_on <= date.
export function getGoalForDate(date: string, goals: Goal[]): number {
  let result = 0
  for (const g of goals) {
    if (g.starts_on <= date) {
      result = g.daily_minutes
    } else {
      break
    }
  }
  return result
}

export function getRateForDate(date: string, goals: Goal[], defaultRate: number = 0.13): number {
  let result = defaultRate
  for (const g of goals) {
    if (g.starts_on <= date) {
      if (g.rate_per_minute != null) result = g.rate_per_minute
    } else {
      break
    }
  }
  return result
}


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
// Now uses goal history to compare each day against the goal that was active on that date
export function computeMonthStats(logs: DailyLog[], goal: number, allGoals?: Goal[]) {
  const monthTotal = logs.reduce((sum, l) => sum + l.minutes, 0)
  const days = logs.length || 1
  const monthAverage = Math.round(monthTotal / days)

  // Group logs by date to get daily totals
  const byDate = new Map<string, number>()
  for (const l of logs) {
    const dKey = l.logged_on.slice(0, 10)
    byDate.set(dKey, (byDate.get(dKey) || 0) + l.minutes)
  }

  let completedDays = 0
  let goalDaySum = 0
  if (allGoals && allGoals.length > 0) {
    for (const [date, mins] of byDate) {
      const dayGoal = getGoalForDate(date, allGoals)
      if (dayGoal > 0 ? mins >= dayGoal : mins > 0) completedDays++
      goalDaySum += dayGoal
    }
  } else {
    completedDays = logs.filter((l) => goal > 0 ? l.minutes >= goal : l.minutes > 0).length
    goalDaySum = goal * byDate.size
  }

  const goalHitRate = byDate.size > 0 ? Math.round((completedDays / byDate.size) * 100) : 0
  const goalProgress = (byDate.size > 0 && goalDaySum > 0) ? Math.round((monthTotal / goalDaySum) * 100) : (monthTotal > 0 ? 100 : 0)
  return { monthTotal, monthAverage, goalHitRate, goalProgress, completedDays }
}

function parseLocalDate(dateStr: string) {
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}


// BUILDS CHART DATA POINTS FROM RECENT LOGS — ALWAYS SHOWS REAL DATA
// Now uses goal history to assign the correct goal per day
export function buildChartData(logs: DailyLog[], goal: number, allGoals?: Goal[]): ChartPoint[] {
  const byDate = new Map<string, number>()
  for (const l of [...logs].sort((a, b) => a.logged_on.localeCompare(b.logged_on))) {
    const dKey = l.logged_on.slice(0, 10)
    byDate.set(dKey, (byDate.get(dKey) || 0) + l.minutes)
  }
  
  const recentLogs = Array.from(byDate.entries()).slice(-14)

  const points = recentLogs.map(([dKey, minutes]) => ({
    day: parseLocalDate(dKey).getDate(),
    minutes: minutes,
    goal: (allGoals && allGoals.length > 0) ? getGoalForDate(dKey, allGoals) : goal
  }))

  if (points.length === 1) {
    const d = parseLocalDate(recentLogs[0][0])
    d.setDate(d.getDate() - 1)
    const prevDateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const prevGoal = (allGoals && allGoals.length > 0) ? getGoalForDate(prevDateKey, allGoals) : goal
    points.unshift({ day: d.getDate(), minutes: 0, goal: prevGoal })
  } else if (points.length === 0) {
    points.push({ day: new Date().getDate(), minutes: 0, goal: goal })
  }

  return points
}


// BUILDS PAGINATED CHART DATA — ALLOWS NAVIGATING FORWARD AND BACKWARD THROUGH TIME
// page=0 is the most recent data, page=1 is the previous window, etc.
const chartDateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
export function buildPaginatedChartData(logs: DailyLog[], goal: number, allGoals?: Goal[], page: number = 0, pageSize: number = 14): ChartPage {
  const byDate = new Map<string, number>()
  for (const l of [...logs].sort((a, b) => a.logged_on.localeCompare(b.logged_on))) {
    const dKey = l.logged_on.slice(0, 10)
    byDate.set(dKey, (byDate.get(dKey) || 0) + l.minutes)
  }

  const allEntries = Array.from(byDate.entries())
  const totalPages = Math.max(1, Math.ceil(allEntries.length / pageSize))
  const safePage = Math.max(0, Math.min(page, totalPages - 1))

  // page 0 = most recent, page 1 = previous window, etc.
  const endIndex = allEntries.length - (safePage * pageSize)
  const startIndex = Math.max(0, endIndex - pageSize)
  const pageEntries = allEntries.slice(startIndex, endIndex)

  const points: ChartPoint[] = pageEntries.map(([dKey, minutes]) => {
    const d = parseLocalDate(dKey)
    return {
      day: d.getDate(),
      minutes,
      goal: (allGoals && allGoals.length > 0) ? getGoalForDate(dKey, allGoals) : goal,
      label: chartDateFormatter.format(d)
    }
  })

  if (points.length === 0) {
    points.push({ day: new Date().getDate(), minutes: 0, goal: goal, label: chartDateFormatter.format(new Date()) })
  }

  // Build date range string
  let dateRange = ''
  if (pageEntries.length > 0) {
    const firstDate = parseLocalDate(pageEntries[0][0])
    const lastDate = parseLocalDate(pageEntries[pageEntries.length - 1][0])
    dateRange = `${chartDateFormatter.format(firstDate)} – ${chartDateFormatter.format(lastDate)}`
  }

  return { points, page: safePage, totalPages, dateRange }
}
// Includes goal status: goalMet (minutes >= goal) and hasEarnings (past day with logged minutes)
// Now uses goal history to check goalMet against the goal active on each specific day
export function buildCalendarData(logs: DailyLog[], goal: number = 0, year?: number, month?: number, allGoals?: Goal[]): CalendarDay[] {
  const now = new Date()
  const targetYear = year ?? now.getFullYear()
  const targetMonth = month ?? now.getMonth()
  const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate()
  const monthKey = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`
  const todayStr = localToday()
  const logMap = new Map<number, number>()
  logs.forEach((l) => {
    if (l.logged_on.startsWith(monthKey)) {
      const d = parseLocalDate(l.logged_on)
      logMap.set(d.getDate(), (logMap.get(d.getDate()) ?? 0) + l.minutes)
    }
  })
  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1
    const minutes = logMap.get(day) ?? 0
    const dayStr = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const isPastDay = dayStr < todayStr
    const dayGoal = (allGoals && allGoals.length > 0) ? getGoalForDate(dayStr, allGoals) : goal
    const goalMet = dayGoal > 0 && minutes >= dayGoal
    // hasEarnings: the day is in the past AND has logged minutes (earnings were counted)
    const hasEarnings = isPastDay && minutes > 0
    return { day, minutes, goalMet, hasEarnings }
  })
}


// GROUPS DAILY LOGS INTO WEEKLY BUCKETS WITH ACTUAL AND GOAL MINUTES
// Now uses goal history — weekly goal is the average of daily goals in that week
export function buildWeeklyData(logs: DailyLog[], goal: number, allGoals?: Goal[]): WeekData[] {
  const weeks: Record<string, { actual: number; goalSum: number; dayCount: number }> = {}
  logs.forEach((l) => {
    const d = parseLocalDate(l.logged_on)
    const key = `W${Math.ceil(d.getDate() / 7)}`
    const dayGoal = (allGoals && allGoals.length > 0) ? getGoalForDate(l.logged_on.slice(0, 10), allGoals) : goal
    if (!weeks[key]) weeks[key] = { actual: 0, goalSum: 0, dayCount: 0 }
    weeks[key].actual += l.minutes
    weeks[key].goalSum += dayGoal
    weeks[key].dayCount++
  })
  return Object.entries(weeks).map(([week, data]) => ({ week, actual: data.actual, goal: data.dayCount > 0 ? Math.round(data.goalSum / data.dayCount) : goal }))
}


// BUILD A LIST OF RECENT ENTRIES WITH HUMAN-READABLE DATE LABELS AND NOTES
export function buildRecentEntries(logs: DailyLog[]): RecentEntry[] {
  const today = localToday()
  const yd = new Date()
  yd.setDate(yd.getDate() - 1)
  const yesterday = `${yd.getFullYear()}-${String(yd.getMonth() + 1).padStart(2, '0')}-${String(yd.getDate()).padStart(2, '0')}`
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  const grouped = new Map<string, { minutes: number; note: string }>()
  
  for (const l of [...logs].sort((a, b) => a.logged_on.localeCompare(b.logged_on))) {
    const dKey = l.logged_on.slice(0, 10)
    const existing = grouped.get(dKey)
    if (existing) {
       existing.minutes += l.minutes
       if (!existing.note && l.note) existing.note = l.note
    } else {
       grouped.set(dKey, { minutes: l.minutes, note: l.note || 'Daily practice' })
    }
  }

  return Array.from(grouped.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([dateKey, data]) => {
      let dateLabel = ''
      if (dateKey === today) dateLabel = 'Today, ' + monthName()
      else if (dateKey === yesterday) dateLabel = 'Yesterday, ' + monthName()
      else {
        const d = parseLocalDate(dateKey)
        dateLabel = `${dayNames[d.getDay()]}, ${monthName(d.getMonth())} ${d.getDate()}`
      }
      return { dateKey, date: dateLabel, minutes: data.minutes, note: data.note }
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
  qualifiedDays: { date: string; minutes: number; note: string | null; earnings: number; qualified: boolean; goalForDate: number }[]
}


// COMPUTES EARNINGS BREAKDOWN — PAST DAYS ALWAYS COUNT (TIME EXPIRED), TODAY ONLY COUNTS IF GOAL IS MET
// Now uses goal history so each day is compared against the goal that was active on that date
export function computeEarnings(logs: DailyLog[], goal: number, ratePerMinute: number, allGoals?: Goal[]): EarningsBreakdown {
  const earn = (minutes: number) => Number((minutes * ratePerMinute).toFixed(2))
  const today = localToday()

  const month = localMonth()
  const year = String(new Date().getFullYear())

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 6)
  const weekStart = dateKey(weekAgo)

  // GROUP LOGS BY DATE TO AGGREGATE MINUTES PER DAY
  const byDate = new Map<string, { minutes: number; note: string | null; logsList: DailyLog[]; earnings: number }>()
  for (const l of [...logs].sort((a, b) => b.logged_on.localeCompare(a.logged_on))) {
    const dKey = l.logged_on.slice(0, 10)
    const logEarnings = l.earnings != null ? l.earnings : earn(l.minutes)
    const existing = byDate.get(dKey)
    if (existing) {
      existing.minutes += l.minutes
      existing.earnings += logEarnings
      if (!existing.note && l.note) existing.note = l.note
      existing.logsList.push(l)
    } else {
      byDate.set(dKey, { minutes: l.minutes, note: l.note, logsList: [l], earnings: logEarnings })
    }
  }

  // DETERMINE WHICH DATES QUALIFY FOR EARNINGS:
  // - PAST DAYS: ALWAYS QUALIFY (TIME EXPIRED, MINUTES MOVE TO EARNINGS REGARDLESS OF GOAL)
  // - TODAY: ONLY QUALIFIES IF GOAL IS MET (STILL IN PROGRESS OTHERWISE)
  const qualifiedDates = new Set<string>()
  for (const [date, d] of byDate) {
    if (d.minutes <= 0) continue
    const dayGoal = (allGoals && allGoals.length > 0) ? getGoalForDate(date, allGoals) : goal
    if (date < today) {
      // PAST DAY — TIME EXPIRED, ALL MINUTES COUNT AS EARNINGS
      qualifiedDates.add(date)
    } else if (date === today) {
      // TODAY — ONLY COUNT IF GOAL IS MET (OR NO GOAL IS SET)
      if (dayGoal <= 0 || d.minutes >= dayGoal) {
        qualifiedDates.add(date)
      }
    }
  }

  // FILTER LOGS TO ONLY QUALIFIED DATES
  const qualified = logs.filter((l) => qualifiedDates.has(l.logged_on.slice(0, 10)))

  const todayEarnings = qualified.filter((l) => l.logged_on.startsWith(today)).reduce((s, l) => s + (l.earnings != null ? l.earnings : earn(l.minutes)), 0)
  const weekEarnings = qualified.filter((l) => l.logged_on.slice(0, 10) >= weekStart && l.logged_on.slice(0, 10) <= today).reduce((s, l) => s + (l.earnings != null ? l.earnings : earn(l.minutes)), 0)
  const monthEarnings = qualified.filter((l) => l.logged_on.startsWith(month)).reduce((s, l) => s + (l.earnings != null ? l.earnings : earn(l.minutes)), 0)
  const yearEarnings = qualified.filter((l) => l.logged_on.startsWith(year)).reduce((s, l) => s + (l.earnings != null ? l.earnings : earn(l.minutes)), 0)
  const totalEarnings = qualified.reduce((s, l) => s + (l.earnings != null ? l.earnings : earn(l.minutes)), 0)

  // QUALIFIED FLAG SHOWS WHETHER THE DAY MET THE GOAL (CHECK ICON) OR JUST EXPIRED (CLOCK ICON)
  // goalForDate is included so the UI can display the correct goal per day
  const qualifiedDays = [...byDate.entries()]
    .slice(0, 14)
    .map(([date, d]) => {
      const dayGoal = (allGoals && allGoals.length > 0) ? getGoalForDate(date, allGoals) : goal
      return {
        date,
        minutes: d.minutes,
        note: d.note,
        earnings: qualifiedDates.has(date) ? d.earnings : 0,
        qualified: dayGoal > 0 ? d.minutes >= dayGoal : d.minutes > 0,
        goalForDate: dayGoal
      }
    })

  return { todayEarnings, weekEarnings, monthEarnings, yearEarnings, totalEarnings, qualifiedDays }
}
