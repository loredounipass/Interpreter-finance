'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { goalMinutes, defaultWorkHours, formatMinutes, getProgress, sumMinutes, getSummaryMessage, computeMonthStats, buildChartData, buildCalendarData, buildRecentEntries, buildWeeklyData, getWeekDelta, getGreeting, getMonthTitle, localToday, localMonth, computeEarnings, getRateForDate } from '@/lib/finance'
import type { DailyLog, Goal } from '@/lib/finance'


// PROVIDES FINANCE TRACKING STATE INCLUDING MINUTES, GOALS, EARNINGS, CHART DATA, AND ALL CRUD OPERATIONS FOR DAILY LOGS
// CUSTOM HOOK TO MANAGE FINANCIAL TRACKING, GOALS, LOGGING OPERATIONS, AND REAL-TIME DATABASE SUBSCRIPTIONS
export function useFinance() {
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [goal, setGoal] = useState(goalMinutes)
  const [allGoals, setAllGoals] = useState<Goal[]>([])
  const [workHours, setWorkHours] = useState(defaultWorkHours)
  const [ratePerMinute, setRatePerMinute] = useState(0.13)
  const [period, setPeriod] = useState<'day' | 'month' | 'year'>('month')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentMinutes, setCurrentMinutes] = useState(0)

  // FETCHES FINANCIAL LOGS AND ACTIVE GOALS FROM THE DATABASE, UPDATING LOCAL STATE FOR THE CURRENT SESSION
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
      const todaysLogs = logsData?.filter((l) => l.logged_on.startsWith(today)) || []
      const calculatedTotal = todaysLogs.reduce((sum, l) => sum + l.minutes, 0)
      setCurrentMinutes(calculatedTotal)

      const { data: allGoalsData, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', session.user.id)
        .order('starts_on', { ascending: true })

      if (goalsError) throw goalsError
      setAllGoals(allGoalsData ?? [])

      // Extract active goal for current goal display
      const goalData = allGoalsData?.find((g: Goal) => g.is_active) ?? null
      if (goalData) {
        setGoal(goalData.daily_minutes)
        if (goalData.work_hours) setWorkHours(goalData.work_hours)
        if ((goalData as any).rate_per_minute != null) setRatePerMinute((goalData as any).rate_per_minute)
      }
    } catch {
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
    () => logs.filter((l) => l.logged_on.startsWith(today)).reduce((sum, l) => sum + l.minutes, 0),
    [logs, today]
  )

  useEffect(() => {
    setCurrentMinutes(todayTotal)
  }, [todayTotal])
  const monthLogs = useMemo(() => {
    const currentMonth = localMonth()
    return logs.filter((l) => l.logged_on.startsWith(currentMonth))
  }, [logs])
  const { monthTotal, monthAverage, goalHitRate, goalProgress, completedDays } = useMemo(() => computeMonthStats(monthLogs, goal, allGoals), [monthLogs, goal, allGoals])

  const chartData = useMemo(() => buildChartData(logs, goal, allGoals), [logs, goal, allGoals])
  const calendarDays = useMemo(() => buildCalendarData(logs, goal, undefined, undefined, allGoals), [logs, goal, allGoals])
  const recentEntries = useMemo(() => buildRecentEntries(logs, goal, allGoals), [logs, goal, allGoals])
  const weeklyData = useMemo(() => buildWeeklyData(logs, goal, allGoals), [logs, goal, allGoals])

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

  const earningsBreakdown = useMemo(
    () => computeEarnings(logs, goal, ratePerMinute, allGoals),
    [logs, goal, ratePerMinute, allGoals]
  )
  const todayEarnings = earningsBreakdown.todayEarnings
  const monthEarnings = earningsBreakdown.monthEarnings

  // ASYNCHRONOUSLY LOGS ADDITIONAL PRACTICE MINUTES FOR THE CURRENT DAY AND UPDATES THE BACKEND DATABASE
  const addMinutes = useCallback(async (value: number) => {
    const mins = Number(value.toFixed(2))
    if (mins <= 0) return
    setCurrentMinutes((prev) => prev + mins)
    setIsSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      const { data, error } = await supabase
        .from('daily_logs')
        .insert([{ user_id: session.user.id, logged_on: today, minutes: mins, earnings: Number((mins * ratePerMinute).toFixed(2)), note: null, is_active: false }])
        .select()
        .single()
      
      if (error) throw error
      setLogs((prev) => [data, ...prev])
    } catch (e: any) {
      console.error('Save minutes error:', e?.message || String(e))
      setCurrentMinutes((prev) => prev - mins)
    } finally {
      setIsSaving(false)
    }
  }, [today, ratePerMinute])

  // DEPRECATED: DUMMY FUNCTION FOR SETTING EXACT MINUTES
  const setMinutes = useCallback((value: number) => {}, []) // Deprecated
  // DEPRECATED: DUMMY FUNCTION FOR MANUALLY TRIGGERING A SAVE OPERATION
  const saveMinutes = useCallback(async () => {}, []) // Deprecated

  // UPDATES THE USER'S DAILY GOAL — DEACTIVATES OLD GOAL AND CREATES A NEW ROW TO PRESERVE HISTORY
  const saveGoal = useCallback(async (value: number, hours?: number, rate?: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      const goalToSave = Number(value.toFixed(2))
      const hoursToSave = hours ?? workHours
      const rateToSave = rate ?? ratePerMinute

      // Deactivate existing active goal (preserve history)
      const { data: existingGoal } = await supabase
        .from('goals')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .single()

      if (existingGoal) {
        const { error: deactivateError } = await supabase
          .from('goals')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('id', existingGoal.id)
        if (deactivateError) throw deactivateError
      }

      // Insert new goal with today's date to create history trail
      const { error: insertError } = await supabase
        .from('goals')
        .insert([{ user_id: session.user.id, daily_minutes: goalToSave, work_hours: hoursToSave, rate_per_minute: rateToSave, starts_on: localToday(), is_active: true }])
      if (insertError) throw insertError

      setGoal(goalToSave)
      setWorkHours(hoursToSave)
      setRatePerMinute(rateToSave)
      // Refresh all goals to update history
      await fetchData()
    } catch (e: any) {
      alert('Save goal error: ' + (e?.message || String(e)))
    }
  }, [workHours, ratePerMinute, fetchData])

  // DELETES A SPECIFIC DAILY LOG ENTRY FROM THE DATABASE BY ITS ID
  const deleteEntry = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('daily_logs').delete().eq('id', id)
      if (error) throw error
      setLogs((prev) => prev.filter((l) => l.id !== id))
    } catch {
    }
  }, [])

  // CREATES A NEW DAILY LOG ENTRY IN THE DATABASE WITH THE SPECIFIED MINUTES AND AN OPTIONAL NOTE
  const addEntry = useCallback(async (mins: number, note?: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return
      const { data, error } = await supabase.from('daily_logs').insert([{ user_id: session.user.id, logged_on: today, minutes: mins, earnings: Number((mins * ratePerMinute).toFixed(2)), note: note ?? null, is_active: false }]).select().single()
      if (error) throw error
      setLogs((prev) => [data, ...prev])
      return data
    } catch {
      return null
    }
  }, [today, ratePerMinute])

  // UPDATES AN EXISTING DAILY LOG ENTRY'S MINUTES AND NOTE IN THE DATABASE
  const updateEntry = useCallback(async (id: string, minutes: number, note?: string | null) => {
    try {
      const existingLog = logs.find((l) => l.id === id)
      const logDate = existingLog ? existingLog.logged_on.slice(0, 10) : today
      const dateRate = getRateForDate(logDate, allGoals, ratePerMinute)
      const { data, error } = await supabase
        .from('daily_logs')
        .update({ minutes: Number(minutes.toFixed(2)), earnings: Number((minutes * dateRate).toFixed(2)), note: note ?? null, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      setLogs((prev) => prev.map((l) => (l.id === id ? data : l)))
      return data
    } catch {
      return null
    }
  }, [logs, today, allGoals, ratePerMinute])

  const periodData = useMemo(() => {
    if (period === 'day') return buildWeeklyData(logs, goal, allGoals)
    if (period === 'year') {
      const yearLogs = logs.filter((l) => new Date(l.logged_on).getFullYear() === new Date().getFullYear())
      return buildWeeklyData(yearLogs, goal, allGoals)
    }
    return weeklyData
  }, [period, logs, goal, allGoals, weeklyData])

  const greeting = useMemo(() => getGreeting(), [])
  const monthTitle = useMemo(() => getMonthTitle(), [])

  return {
    currentMinutes, minutes: currentMinutes, goal, allGoals, workHours, ratePerMinute, period, setPeriod, progress, addMinutes, setMinutes, saveMinutes, saveGoal, isSaving, isLoading,
    monthTotal, monthAverage, goalHitRate, goalProgress, completedDays, summary, weeklyData: periodData, chartData, calendarDays, dailyData: chartData,
    recentEntries, summaryMessage, weekDelta, greeting, monthTitle, deleteEntry, addEntry, updateEntry, logs,
    todayEarnings, monthEarnings, todayTotal,
  }
}