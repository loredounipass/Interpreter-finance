export type Period = 'day' | 'month' | 'year'

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
export type Summary = { total: string; average: string; rate: string; streak: number }

export const formatMinutes = (minutes: number) => {
  const h = Math.floor(minutes / 60)
  const m = Number((minutes % 60).toFixed(2))
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}
export const defaultWorkHours = 15
export const goalMinutes = 0
export const defaultGoal = { minutes: 400, label: 'Daily interpretation goal' }

/** Returns today's date as YYYY-MM-DD in LOCAL timezone (not UTC) */
export function localToday() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Returns current month as YYYY-MM in LOCAL timezone */
export function localMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function getMinutesPerHour(goal: number, workHours = defaultWorkHours) {
  if (workHours <= 0) return 0
  return Number((goal / workHours).toFixed(1))
}

export function getWholeMinutesPerHour(goal: number, workHours = defaultWorkHours) {
  if (workHours <= 0) return 0
  return Math.ceil(goal / workHours)
}

export function getProgress(minutes: number, goal = goalMinutes) {
  if (goal === 0) return minutes > 0 ? 100 : 0
  return Math.min(Math.round((minutes / goal) * 100), 100)
}

export function getGreeting() {
  const hour = new Date().getHours()
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
}

export function getMonthLabel() {
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date())
}

export function monthName(monthIndex?: number) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  return months[monthIndex ?? new Date().getMonth()]
}

export function getCurrentDate() {
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date())
}

export function getCurrentDateLabel() {
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date())
}

export function getMonthTitle() {
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date())
}

export function getDateLabel(day: number) {
  return `${monthName()} ${day}, ${new Date().getFullYear()}`
}

export function getSummaryMessage(monthTotal: number, goalMinutes: number, completedDays: number, totalDays: number) {
  if (completedDays === 0) return 'Start your streak today.'
  const avg = Math.round(monthTotal / Math.max(completedDays, 1))
  if (avg >= goalMinutes) return 'You are building a strong rhythm. Keep the momentum going.'
  if (avg >= goalMinutes * 0.7) return 'Great pace, you are close to your daily goal.'
  return 'Consistency is key. Every minute counts.'
}

export function getWeekDelta(monthTotal: number, prevMonthTotal: number) {
  if (prevMonthTotal === 0) return '+0%'
  const delta = ((monthTotal - prevMonthTotal) / prevMonthTotal * 100)
  return `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`
}

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

export function buildChartData(logs: DailyLog[], goal: number): ChartPoint[] {
  const recentLogs = [...logs].slice(0, 14).reverse()
  
  const points = recentLogs.map((l) => ({
    day: parseLocalDate(l.logged_on).getDate(),
    minutes: l.minutes,
    goal
  }))

  if (points.length === 1) {
    const d = parseLocalDate(recentLogs[0].logged_on)
    d.setDate(d.getDate() - 1)
    points.unshift({ day: d.getDate(), minutes: 0, goal })
  } else if (points.length === 0) {
    points.push({ day: new Date().getDate(), minutes: 0, goal })
  }

  return points
}

export function buildCalendarData(logs: DailyLog[]): CalendarDay[] {
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
  const logMap = new Map(logs.map((l) => [parseLocalDate(l.logged_on).getDate(), l.minutes]))
  return Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, minutes: logMap.get(i + 1) ?? 0 }))
}

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

export function getPeriodData(period: Period, logs: DailyLog[], goal: number) {
  if (period === 'day') return buildDayData()
  if (period === 'year') return buildYearData()
  return buildWeeklyData(logs, goal)
}

export function buildDayData(): ChartPoint[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const goal = 60
  return days.map((day, index) => ({ day: index + 1, minutes: [62, 74, 55, 88, 69, 42, 51][index], goal }))
}

export function buildYearData(): WeekData[] {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']
  return months.map((month, index) => ({ week: month, actual: 420 + index * 53, goal: 420 }))
}

export function aggregateByMonth(logs: DailyLog[]): Record<string, number> {
  const map: Record<string, number> = {}
  logs.forEach((l) => { const m = l.logged_on.slice(0, 7); map[m] = (map[m] || 0) + l.minutes })
  return map
}

export function aggregateByYear(logs: DailyLog[]): Record<string, number> {
  const map: Record<string, number> = {}
  logs.forEach((l) => { const y = l.logged_on.slice(0, 4); map[y] = (map[y] || 0) + l.minutes })
  return map
}

export const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ')

export const dayOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export const navItems = [
  { label: 'Overview', icon: 'LayoutDashboard' }, { label: 'Daily log', icon: 'Clock3' },
  { label: 'Goals', icon: 'Target' }, { label: 'Insights', icon: 'ChartNoAxesCombined' },
]

export const sidebarSections = [{ label: 'Workspace', items: navItems }, { label: 'Manage', items: [{ label: 'Settings', icon: 'Settings2' }] }]

export const quickAddOptions = [15, 30, 45, 60]

export const statCopy = { total: 'Time interpreted this month', average: 'Average per working day', rate: 'Days hitting your goal', streak: 'Current day streak' }

export const chartLabels = { minutes: 'Minutes', goal: 'Daily goal' }

export const appName = 'Interpreter Finance'
export const appTagline = 'Your practice, quantified.'
export const footerText = 'Built for interpreters who keep showing up.'

export const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const
export const routeDescription = 'All finance data is routed through Supabase.'
export const source = 'supabase'
export const locale = 'en-US'
export const currency = 'USD'

export const goalLabel = `${goalMinutes} min / day`

export const isValidMinutes = (value: number) => Number.isFinite(value) && value >= 0 && value <= 1440
export const normalizeMinutes = (value: number) => Math.round(Math.max(0, Math.min(value, 1440)))
export const percentageLabel = (value: number) => `${Math.round(value)}%`
export const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
export function sumMinutes(entries: FinanceEntry[]) { return entries.reduce((sum, item) => sum + item.minutes, 0) }
export function averageMinutes(entries: FinanceEntry[]) { return entries.length ? Math.round(sumMinutes(entries) / entries.length) : 0 }
export function hitRate(entries: FinanceEntry[], goal = goalMinutes) { return entries.length ? Math.round((entries.filter((item) => item.minutes >= goal).length / entries.length) * 100) : 0 }
export function toHours(minutes: number) { return Number((minutes / 60).toFixed(1)) }
export function toPercent(value: number, total: number) { return total ? Math.round((value / total) * 100) : 0 }

export function formatDate(date: string) { return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(new Date(`${date}T12:00:00`)) }
export function formatLongDate(date: string) { return new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(`${date}T12:00:00`)) }

export function getMonthlyGoal(goal = goalMinutes, days = 31) { return goal * days }

export function hasHitGoal(minutes: number, goal = goalMinutes) { return minutes >= goal }

export type EarningsBreakdown = {
  todayEarnings: number
  weekEarnings: number
  monthEarnings: number
  yearEarnings: number
  totalEarnings: number
  qualifiedDays: { date: string; minutes: number; note: string | null; earnings: number; qualified: boolean }[]
}

/** Earnings only count on days where the daily goal was met. */
export function computeEarnings(logs: DailyLog[], goal: number, ratePerMinute: number): EarningsBreakdown {
  const earn = (minutes: number) => Number((minutes * ratePerMinute).toFixed(2))
  const qualifies = (l: DailyLog) => goal > 0 ? l.minutes >= goal : l.minutes > 0

  const today = localToday()
  const month = localMonth()
  const year = String(new Date().getFullYear())

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 6)
  const weekStart = dateKey(weekAgo)

  const qualified = logs.filter(qualifies)

  const todayLog = logs.find((l) => l.logged_on === today)
  const todayEarnings = todayLog && qualifies(todayLog) ? earn(todayLog.minutes) : 0
  const weekEarnings = qualified.filter((l) => l.logged_on >= weekStart && l.logged_on <= today).reduce((s, l) => s + earn(l.minutes), 0)
  const monthEarnings = qualified.filter((l) => l.logged_on.startsWith(month)).reduce((s, l) => s + earn(l.minutes), 0)
  const yearEarnings = qualified.filter((l) => l.logged_on.startsWith(year)).reduce((s, l) => s + earn(l.minutes), 0)
  const totalEarnings = qualified.reduce((s, l) => s + earn(l.minutes), 0)

  const qualifiedDays = [...logs]
    .sort((a, b) => b.logged_on.localeCompare(a.logged_on))
    .slice(0, 14)
    .map((l) => ({ date: l.logged_on, minutes: l.minutes, note: l.note, earnings: earn(l.minutes), qualified: qualifies(l) }))

  return { todayEarnings, weekEarnings, monthEarnings, yearEarnings, totalEarnings, qualifiedDays }
}

export type NavItem = typeof navItems[number]
export type RecentEntryData = RecentEntry

export const empty = null
export const placeholder = '—' as const
export const noOp = () => undefined
export const isComplete = true
export const done = true