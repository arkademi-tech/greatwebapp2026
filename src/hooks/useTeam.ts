import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Team, Member } from '../types/database'

const STORAGE_KEY = 'splitmate_session'

interface Session {
  teamId: string
  memberId: string
}

export function useTeam() {
  const [team, setTeam]       = useState<Team | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [session, setSession] = useState<Session | null>(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const loadTeam = useCallback(async (teamId: string) => {
    setLoading(true)
    setError(null)
    try {
      const [{ data: t, error: te }, { data: m, error: me }] = await Promise.all([
        supabase.from('teams').select('*').eq('id', teamId).single(),
        supabase.from('members').select('*').eq('team_id', teamId).order('created_at'),
      ])
      if (te) throw te
      if (me) throw me
      setTeam(t)
      setMembers(m ?? [])
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (session?.teamId) loadTeam(session.teamId)
  }, [session?.teamId, loadTeam])

  const joinByToken = async (token: string, myName: string): Promise<boolean> => {
    setLoading(true)
    try {
      const { data: t, error: te } = await supabase
        .from('teams').select('*').eq('share_token', token).single()
      if (te || !t) { setError('Tim tidak ditemukan'); return false }

      const { data: existingMembers } = await supabase
        .from('members').select('*').eq('team_id', t.id)

      let member = existingMembers?.find(
        m => m.name.toLowerCase() === myName.toLowerCase()
      )
      if (!member) {
        const { data: newMember, error: me } = await supabase
          .from('members').insert({ team_id: t.id, name: myName }).select().single()
        if (me) throw me
        member = newMember!
      }

      const sess: Session = { teamId: t.id, memberId: member.id }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sess))
      setSession(sess)
      return true
    } catch (e: unknown) {
      setError((e as Error).message)
      return false
    } finally {
      setLoading(false)
    }
  }

  const createTeam = async (teamName: string, memberNames: string[], myName: string): Promise<boolean> => {
    setLoading(true)
    try {
      const { data: t, error: te } = await supabase
        .from('teams').insert({ name: teamName }).select().single()
      if (te || !t) throw te

      const memberInserts = memberNames.map(name => ({ team_id: t.id, name }))
      const { data: newMembers, error: me } = await supabase
        .from('members').insert(memberInserts).select()
      if (me) throw me

      const me2 = newMembers!.find(m => m.name === myName) ?? newMembers![0]
      const sess: Session = { teamId: t.id, memberId: me2.id }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sess))
      setSession(sess)
      return true
    } catch (e: unknown) {
      setError((e as Error).message)
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setSession(null)
    setTeam(null)
    setMembers([])
  }

  return { team, members, session, loading, error, joinByToken, createTeam, logout, reload: () => session && loadTeam(session.teamId) }
}
