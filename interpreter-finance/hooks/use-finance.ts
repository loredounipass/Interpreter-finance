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
      const todayLog = logsData?.find((l) => l.logged_on === today)
      if (todayLog) setCurrentMinutes(todayLog.minutes)

      const { data: goalData, error: goalError } = await supabase
        .from('goals')
        .select('id, daily_minutes, work_hours, rate_per_minute')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .single()

      if (goalError && goalError.code !== 'PGRST116') throw goalError
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
      .channel('realtime-finance')
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

  const todayLogs = useMemo(() => logs.filter((l) => l.logged_on === today), [logs, today])
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

  const todayEarnings = useMemo(() => Number((currentMinutes * ratePerMinute).toFixed(2)), [currentMinutes, ratePerMinute])
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
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      if (minutesToSave === 0) {
        if (todayLogs.length > 0) {
          const { error } = await supabase.from('daily_logs').delete().eq('id', todayLogs[0].id)
          if (error) throw error
          setLogs((prev) => prev.filter((l) => l.id !== todayLogs[0].id))
        }
      } else if (todayLogs.length > 0) {
        const { data, error } = await supabase.from('daily_logs').update({ minutes: minutesToSave, updated_at: new Date().toISOString() }).eq('id', todayLogs[0].id).select().single()
        if (error) throw error
        setLogs((prev) => prev.map((l) => l.id === todayLogs[0].id ? data : l))
      } else {
        const { data, error } = await supabase.from('daily_logs').insert([{ user_id: session.user.id, logged_on: today, minutes: minutesToSave, note: null }]).select().single()
        if (error) throw error
        setLogs((prev) => [data, ...prev])
      }
    } catch (e: any) {
      console.error('Save minutes error:', e?.message || String(e))
    } finally {
      setIsSaving(false)
    }
  }, [currentMinutes, todayLogs, today])

  const addMinutes = useCallback((value: number) => {
    persistMinutes(currentMinutes + value)
  }, [currentMinutes, persistMinutes])

  const setMinutes = useCallback((value: number) => {
    if (value === 0) {
      persistMinutes(0)
    } else {
      setCurrentMinutes(value)
    }
  }, [persistMinutes])

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
      const { data, error } = await supabase.from('daily_logs').insert([{ user_id: session.user.id, logged_on: today, minutes: mins, note: note ?? null }]).select().single()
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
    monthTotal, monthAverage, goalHitRate, goalProgress, completedDays, summary, weeklyData: periodData, chartData, calendarDays,
    recentEntries, summaryMessage, weekDelta, greeting, monthTitle, deleteEntry, addEntry, logs,
    todayEarnings, monthEarnings,
  }
}