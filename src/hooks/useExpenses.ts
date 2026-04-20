import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Expense } from '../types/database'

export function useExpenses(teamId: string | undefined) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!teamId) return
    setLoading(true)
    setError(null)
    const { data, error: e } = await supabase
      .from('expenses')
      .select('*')
      .eq('team_id', teamId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
    if (e) setError(e.message)
    else setExpenses(data ?? [])
    setLoading(false)
  }, [teamId])

  useEffect(() => { load() }, [load])

  const addExpense = async (
    data: Omit<Expense, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Expense | null> => {
    const { data: row, error: e } = await supabase
      .from('expenses').insert(data).select().single()
    if (e) { setError(e.message); return null }
    setExpenses(prev => [row, ...prev])
    return row
  }

  const updateExpense = async (id: string, data: Partial<Expense>): Promise<boolean> => {
    const { data: row, error: e } = await supabase
      .from('expenses').update(data).eq('id', id).select().single()
    if (e) { setError(e.message); return false }
    setExpenses(prev => prev.map(x => x.id === id ? row : x))
    return true
  }

  const deleteExpense = async (id: string): Promise<boolean> => {
    const { error: e } = await supabase.from('expenses').delete().eq('id', id)
    if (e) { setError(e.message); return false }
    setExpenses(prev => prev.filter(x => x.id !== id))
    return true
  }

  const toggleSettled = async (id: string): Promise<boolean> => {
    const expense = expenses.find(x => x.id === id)
    if (!expense) return false
    return updateExpense(id, { is_settled: !expense.is_settled })
  }

  return { expenses, loading, error, reload: load, addExpense, updateExpense, deleteExpense, toggleSettled }
}
