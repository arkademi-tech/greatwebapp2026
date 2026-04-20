import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { Team, Member } from '../types/database'

interface Session { teamId: string; memberId: string }

interface TeamCtx {
  team: Team | null
  members: Member[]
  session: Session | null
  loading: boolean
  error: string | null
  createTeam: (teamName: string, memberNames: string[], myName: string) => Promise<boolean>
  joinByToken: (token: string, myName: string) => Promise<boolean>
  logout: () => void
  reloadTeam: () => void
}

const Ctx = createContext<TeamCtx>({} as TeamCtx)

const STORAGE_KEY = 'splitmate_session'

export function TeamProvider({ children }: { children: ReactNode }) {
  const [team, setTeam]       = useState<Team | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [session, setSession] = useState<Session | null>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') }
    catch { return null }
  })

  const loadTeam = useCallback(async (teamId: string) => {
    setLoading(true)
    setError(null)
    const [{ data: t, error: te }, { data: m, error: me }] = await Promise.all([
      supabase.from('teams').select('*').eq('id', teamId).single(),
      supabase.from('members').select('*').eq('team_id', teamId).order('created_at'),
    ])
    if (te || me) { setError((te ?? me)!.message); setLoading(false); return }
    setTeam(t)
    setMembers(m ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (session?.teamId) loadTeam(session.teamId)
    else { setTeam(null); setMembers([]) }
  }, [session?.teamId, loadTeam])

  const joinByToken = async (token: string, myName: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      const { data: t, error: te } = await supabase
        .from('teams').select('*').eq('share_token', token).single()
      if (te || !t) { setError('Tim tidak ditemukan'); return false }

      const { data: existing } = await supabase.from('members').select('*').eq('team_id', t.id)
      let member = existing?.find(m => m.name.toLowerCase() === myName.trim().toLowerCase())
      if (!member) {
        const { data: nm, error: me } = await supabase
          .from('members').insert({ team_id: t.id, name: myName.trim() }).select().single()
        if (me) throw me
        member = nm!
      }
      const sess: Session = { teamId: t.id, memberId: member.id }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sess))
      setSession(sess)
      return true
    } catch (e: unknown) {
      setError((e as Error).message)
      return false
    } finally { setLoading(false) }
  }

  const createTeam = async (teamName: string, memberNames: string[], myName: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      const { data: t, error: te } = await supabase
        .from('teams').insert({ name: teamName.trim() }).select().single()
      if (te || !t) throw te ?? new Error('Gagal membuat tim')

      const names = [...new Set(memberNames.map(n => n.trim()).filter(Boolean))]
      const { data: newMembers, error: me } = await supabase
        .from('members').insert(names.map(name => ({ team_id: t.id, name }))).select()
      if (me) throw me

      const me2 = newMembers!.find(m => m.name === myName.trim()) ?? newMembers![0]
      const sess: Session = { teamId: t.id, memberId: me2.id }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sess))
      setSession(sess)
      return true
    } catch (e: unknown) {
      setError((e as Error).message)
      return false
    } finally { setLoading(false) }
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setSession(null)
    setTeam(null)
    setMembers([])
  }

  return (
    <Ctx.Provider value={{ team, members, session, loading, error, createTeam, joinByToken, logout, reloadTeam: () => session && loadTeam(session.teamId) }}>
      {children}
    </Ctx.Provider>
  )
}

export const useTeam = () => useContext(Ctx)
