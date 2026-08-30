'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { goalMinutes, defaultWorkHours, formatMinutes, getProgress, sumMinutes, getSummaryMessage, computeMonthStats, buildChartData, buildCalendarData, buildRecentEntries, buildWeeklyData, getWeekDelta, getGreeting, getMonthTitle, localToday, localMonth } from '@/lib/finance'
import type { DailyLog } from '@/lib/finance'

export function useFinance() {
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [goal, setGoal] = useState(goalMinutes)
  const [workHours, setWorkHours] = useState(defaultWorkHours)
  const [ratePerMinute, setRatePerMinute] = useState(0.13)
  const [period, setPeriod] = useState<'day' | 'month' | 'year'>('month')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentMinutes, setCurrentMinutes] = useState(0)
  // id of the in-progress session row (is_active = true). Other rows are
  // archived history that feeds Latest logs and earnings, and never get
  // overwritten when the counter is reset.
  const [activeLogId, setActiveLogId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { setIsLoading(false); return }

      const { data: logsData, error: logsError } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', session.user.id)
        .order('logged_on', { ascending: false })

      if (logsError) throw logsError
      setLogs(logsData ?? [])

      const today = localToday()
      const activeLog = logsData?.find((l) => l.logged_on === today && l.is_active)
      if (activeLog) {
        setActiveLogId(activeLog.id)
        setCurrentMinutes(activeLog.minutes)
      } else {
        setActiveLogId(null)
        setCurrentMinutes(0)
      }

      const { data: goalData, error: goalError } = await supabase
        .from('goals')
        .select('id, daily_minutes, work_hours, rate_per_minute')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .maybeSingle()

      if (goalError) throw goalError
      if (goalData) {
        setGoal(goalData.daily_minutes)
        if (goalData.work_hours) setWorkHours(goalData.work_hours)
        if (goalData.rate_per_minute != null) setRatePerMinute(goalData.rate_per_minute)
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    const channel = supabase
      .channel(`realtime-finance-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_logs' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'goals' }, fetchData)
      .subscribe()

    const poll = setInterval(() => {
      if (document.visibilityState === 'visible') fetchData()
    }, 30000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(poll)
    }
  }, [fetchData])

  const today = localToday()

  const todayTotal = useMemo(
    () => logs.filter((l) => l.logged_on === today).reduce((sum, l) => sum + l.minutes, 0),
    [logs, today]
  )
  const monthLogs = useMemo(() => {
    const currentMonth = localMonth()
    return logs.filter((l) => l.logged_on.startsWith(currentMonth))
  }, [logs])
  const { monthTotal, monthAverage, goalHitRate, goalProgress, completedDays } = useMemo(() => computeMonthStats(monthLogs, goal), [monthLogs, goal])

  const chartData = useMemo(() => buildChartData(logs, goal), [logs, goal])
  const calendarDays = useMemo(() => buildCalendarData(logs), [logs])
  const recentEntries = useMemo(() => buildRecentEntries(logs), [logs])
  const weeklyData = useMemo(() => buildWeeklyData(logs, goal), [logs, goal])

  const prevMonthTotal = useMemo(() => {
    const now = new Date()
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevMonth = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`
    return logs.filter((l) => l.logged_on.startsWith(prevMonth)).reduce((sum, l) => sum + l.minutes, 0)
  }, [logs])

  const summary = useMemo(() => ({
    total: formatMinutes(monthTotal),
    average: formatMinutes(monthAverage),
    rate: `${goalHitRate}%`,
    streak: completedDays,
  }), [monthTotal, monthAverage, goalHitRate, completedDays])

  const summaryMessage = useMemo(() => getSummaryMessage(monthTotal, goal, completedDays, new Date().getDate()), [monthTotal, goal, completedDays])
  const weekDelta = useMemo(() => getWeekDelta(monthTotal, prevMonthTotal), [monthTotal, prevMonthTotal])

  const progress = useMemo(() => getProgress(currentMinutes, goal), [currentMinutes, goal])

  const todayEarnings = useMemo(() => Number((todayTotal * ratePerMinute).toFixed(2)), [todayTotal, ratePerMinute])
  const monthEarnings = useMemo(() => {
    const now = new Date()
    const dayOfMonth = now.getDate()
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const projectedTotal = dayOfMonth > 0 ? (monthTotal / dayOfMonth) * daysInMonth : monthTotal
    return Number((projectedTotal * ratePerMinute).toFixed(2))
  }, [monthTotal, ratePerMinute])

  const persistMinutes = useCallback(async (newTotal: number) => {
    const minutesToSave = Number(newTotal.toFixed(2))
    setCurrentMinutes(minutesToSave)
    setIsSaving(true)
    try {
      if (minutesToSave < 0) return
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      if (activeLogId) {
        const { data, error } = await supabase
          .from('daily_logs')
          .update({ minutes: minutesToSave, updated_at: new Date().toISOString() })
          .eq('id', activeLogId)
          .select()
          .single()
        if (error) throw error
        setLogs((prev) => prev.map((l) => (l.id === activeLogId ? data : l)))
      } else {
        if (minutesToSave === 0) return
        const { data, error } = await supabase
          .from('daily_logs')
          .insert([{ user_id: session.user.id, logged_on: today, minutes: minutesToSave, note: null, is_active: true }])
          .select()
          .single()
        if (error) throw error
        setActiveLogId(data.id)
        setLogs((prev) => [data, ...prev])
      }
    } catch (e: any) {
      console.error('Save minutes error:', e?.message || String(e))
    } finally {
      setIsSaving(false)
    }
  }, [activeLogId, today])

  const addMinutes = useCallback((value: number) => {
    persistMinutes(currentMinutes + value)
  }, [currentMinutes, persistMinutes])

  const setMinutes = useCallback((value: number) => {
    if (value === 0) {
      // Reset: archive the current session row (keep its minutes) so Latest
      // logs and earnings are preserved, then start a fresh session at 0.
      const archivedId = activeLogId
      if (archivedId) {
        setActiveLogId(null)
        setCurrentMinutes(0)
        setLogs((prev) => prev.map((l) => (l.id === archivedId ? { ...l, is_active: false } : l)))
        supabase
          .from('daily_logs')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('id', archivedId)
          .then(({ error }) => { if (error) console.error('Archive log error:', error.message) })
      } else {
        setCurrentMinutes(0)
      }
    } else {
      setCurrentMinutes(value)
    }
  }, [activeLogId])

  const saveMinutes = useCallback(async () => {
    await persistMinutes(currentMinutes)
  }, [currentMinutes, persistMinutes])

  const saveGoal = useCallback(async (value: number, hours?: number, rate?: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      const goalToSave = Number(value.toFixed(2))
      const hoursToSave = hours ?? workHours
      const rateToSave = rate ?? ratePerMinute

      const { data: existingGoal } = await supabase
        .from('goals')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .single()

      if (existingGoal) {
        const { error } = await supabase
          .from('goals')
          .update({ daily_minutes: goalToSave, work_hours: hoursToSave, rate_per_minute: rateToSave, updated_at: new Date().toISOString() })
          .eq('id', existingGoal.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('goals')
          .insert([{ user_id: session.user.id, daily_minutes: goalToSave, work_hours: hoursToSave, rate_per_minute: rateToSave, starts_on: localToday(), is_active: true }])
        if (error) throw error
      }

      setGoal(goalToSave)
      setWorkHours(hoursToSave)
      setRatePerMinute(rateToSave)
    } catch (e: any) {
      alert('Save goal error: ' + (e?.message || String(e)))
    }
  }, [workHours, ratePerMinute])

  const deleteEntry = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('daily_logs').delete().eq('id', id)
      if (error) throw error
      setLogs((prev) => prev.filter((l) => l.id !== id))
    } catch {
      // ignore
    }
  }, [])

  const addEntry = useCallback(async (mins: number, note?: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return
      const { data, error } = await supabase.from('daily_logs').insert([{ user_id: session.user.id, logged_on: today, minutes: mins, note: note ?? null, is_active: false }]).select().single()
      if (error) throw error
      setLogs((prev) => [data, ...prev])
      return data
    } catch {
      return null
    }
  }, [today])

  const periodData = useMemo(() => {
    if (period === 'day') return buildWeeklyData(logs, goal)
    if (period === 'year') {
      const yearLogs = logs.filter((l) => new Date(l.logged_on).getFullYear() === new Date().getFullYear())
      return buildWeeklyData(yearLogs, goal)
    }
    return weeklyData
  }, [period, logs, goal, weeklyData])

  const greeting = useMemo(() => getGreeting(), [])
  const monthTitle = useMemo(() => getMonthTitle(), [])

  return {
    currentMinutes, minutes: currentMinutes, goal, workHours, ratePerMinute, period, setPeriod, progress, addMinutes, setMinutes, saveMinutes, saveGoal, isSaving, isLoading,
    monthTotal, monthAverage, goalHitRate, goalProgress, completedDays, summary, weeklyData: periodData, chartData, calendarDays, dailyData: chartData,
    recentEntries, summaryMessage, weekDelta, greeting, monthTitle, deleteEntry, addEntry, logs,
    todayEarnings, monthEarnings, todayTotal,
  }
}