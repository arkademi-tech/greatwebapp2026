import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Settlement } from '../types/database'

export function useSettlements(teamId: string | undefined) {
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!teamId) return
    setLoading(true)
    const { data, error: e } = await supabase
      .from('settlements')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false })
    if (e) setError(e.message)
    else setSettlements(data ?? [])
    setLoading(false)
  }, [teamId])

  useEffect(() => { load() }, [load])

  const saveSettlements = async (
    rows: Omit<Settlement, 'id' | 'created_at'>[]
  ): Promise<boolean> => {
    const { error: e } = await supabase.from('settlements').insert(rows)
    if (e) { setError(e.message); return false }
    await load()
    return true
  }

  const markPaid = async (id: string): Promise<boolean> => {
    const { data, error: e } = await supabase
      .from('settlements')
      .update({ is_paid: true, paid_at: new Date().toISOString() })
      .eq('id', id).select().single()
    if (e) { setError(e.message); return false }
    setSettlements(prev => prev.map(x => x.id === id ? data : x))
    return true
  }

  return { settlements, loading, error, reload: load, saveSettlements, markPaid }
}
