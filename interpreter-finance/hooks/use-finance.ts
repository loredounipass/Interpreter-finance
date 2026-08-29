'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { goalMinutes, defaultWorkHours, formatMinutes, getProgress, sumMinutes, getSummaryMessage, computeMonthStats, buildChartData, buildCalendarData, buildRecentEntries, buildWeeklyData, getWeekDelta, getGreeting, getMonthTitle } from '@/lib/finance'
import type { DailyLog } from '@/lib/finance'

export function useFinance() {
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [goal, setGoal] = useState(goalMinutes)
  const [period, setPeriod] = useState<'day' | 'month' | 'year'>('month')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentMinutes, setCurrentMinutes] = useState(0)

  useEffect(() => {
    async function fetchData() {
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

        const today = new Date().toISOString().slice(0, 10)
        const todayLog = logsData?.find((l) => l.logged_on === today)
        if (todayLog) setCurrentMinutes(todayLog.minutes)

        const { data: goalData, error: goalError } = await supabase
          .from('goals')
          .select('daily_minutes')
          .eq('is_active', true)
          .single()

        if (goalError && goalError.code !== 'PGRST116') throw goalError
        if (goalData) setGoal(goalData.daily_minutes)
      } catch {
        // ignore
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const today = new Date().toISOString().slice(0, 10)

  const todayLogs = useMemo(() => logs.filter((l) => l.logged_on === today), [logs, today])
  const monthLogs = useMemo(() => logs.filter((l) => { const d = new Date(l.logged_on); return d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear() }), [logs])
  const { monthTotal, monthAverage, goalHitRate, goalProgress, completedDays } = useMemo(() => computeMonthStats(monthLogs, goal), [monthLogs, goal])

  const chartData = useMemo(() => buildChartData(logs, goal), [logs, goal])
  const calendarDays = useMemo(() => buildCalendarData(logs), [logs])
  const recentEntries = useMemo(() => buildRecentEntries(logs), [logs])
  const weeklyData = useMemo(() => buildWeeklyData(logs, goal), [logs, goal])

  const prevMonthTotal = useMemo(() => {
    const prevMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 7)
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

  const addMinutes = useCallback((value: number) => {
    setCurrentMinutes((prev) => prev + value)
  }, [])

  const setMinutes = useCallback((value: number) => {
    setCurrentMinutes(value)
  }, [])

  const saveMinutes = useCallback(async () => {
    setIsSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return
      if (currentMinutes === 0) {
        if (todayLogs.length > 0) {
          const { error } = await supabase.from('daily_logs').delete().eq('id', todayLogs[0].id)
          if (error) throw error
          setLogs((prev) => prev.filter((l) => l.id !== todayLogs[0].id))
        }
      } else if (todayLogs.length > 0) {
        const { error } = await supabase.from('daily_logs').update({ minutes: currentMinutes, updated_at: new Date().toISOString() }).eq('id', todayLogs[0].id)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('daily_logs').insert([{ user_id: session.user.id, logged_on: today, minutes: currentMinutes, note: null }]).select().single()
        if (error) throw error
        setLogs((prev) => [data, ...prev])
      }
      setCurrentMinutes(0)
    } catch {
      // ignore
    } finally {
      setIsSaving(false)
    }
  }, [currentMinutes, today, todayLogs])

  const saveGoal = useCallback(async (value: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return
      const { error } = await supabase.from('goals').upsert([{ user_id: session.user.id, daily_minutes: value, work_hours: defaultWorkHours, starts_on: new Date().toISOString().slice(0, 10), is_active: true }])
      if (error) throw error
      setGoal(value)
    } catch {
      // ignore
    }
  }, [])

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
    currentMinutes, minutes: currentMinutes, goal, period, setPeriod, progress, addMinutes, setMinutes, saveMinutes, saveGoal, isSaving, isLoading,
    monthTotal, monthAverage, goalHitRate, goalProgress, completedDays, summary, weeklyData: periodData, chartData, calendarDays,
    recentEntries, summaryMessage, weekDelta, greeting, monthTitle, deleteEntry, addEntry, logs,
  }
}