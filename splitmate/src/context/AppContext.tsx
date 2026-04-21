import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { DbExpense, DbMember, DbTeam } from '../lib/db.types';
import type { Expense } from '../types';

// ─── types ──────────────────────────────────────────────────────────────────

interface AppCtx {
  // auth
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;

  // team
  team: DbTeam | null;
  members: DbMember[];
  currentMember: DbMember | null;

  // expenses (name-mapped, ready for UI)
  expenses: Expense[];
  expensesLoading: boolean;
  refreshExpenses: () => Promise<void>;
  addExpense: (data: Omit<Expense, 'id' | 'paid'>) => Promise<void>;
  updateExpense: (id: string, data: Omit<Expense, 'id' | 'paid'>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  toggleSettled: (id: string, current: boolean) => Promise<void>;

  // helpers
  memberName: (uuid: string) => string;
  memberId: (name: string) => string;
}

const Ctx = createContext<AppCtx | null>(null);

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

// ─── helpers ────────────────────────────────────────────────────────────────

function buildMaps(members: DbMember[]) {
  const byId: Record<string, string> = {};
  const byName: Record<string, string> = {};
  members.forEach(m => { byId[m.id] = m.name; byName[m.name] = m.id; });
  return { byId, byName };
}

function dbToLocal(e: DbExpense, byId: Record<string, string>): Expense {
  return {
    id: e.id,
    date: e.date,
    desc: e.description,
    cat: e.category,
    amount: Number(e.amount),
    paidBy: byId[e.paid_by] ?? e.paid_by,
    split: (e.split_among ?? []).map(uid => byId[uid] ?? uid),
    note: e.notes ?? '',
    paid: e.is_settled,
  };
}

// ─── provider ───────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession]         = useState<Session | null>(null);
  const [user, setUser]               = useState<User | null>(null);
  const [loading, setLoading]         = useState(true);
  const [team, setTeam]               = useState<DbTeam | null>(null);
  const [members, setMembers]         = useState<DbMember[]>([]);
  const [currentMember, setCurrent]   = useState<DbMember | null>(null);
  const [expenses, setExpenses]       = useState<Expense[]>([]);
  const [expensesLoading, setExpLoad] = useState(false);
  const [maps, setMaps]               = useState<{ byId: Record<string,string>; byName: Record<string,string> }>({ byId: {}, byName: {} });

  // ── load session ──────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_ev, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── load team + members when user changes ─────────────────────────────────
  useEffect(() => {
    if (!user) {
      setTeam(null); setMembers([]); setCurrent(null); setExpenses([]); setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        // find member linked to this user
        const { data: mem } = await supabase
          .from('members').select('*').eq('user_id', user.id).single();
        if (!mem) { setLoading(false); return; }
        setCurrent(mem);

        // load all team members
        const { data: allMembers } = await supabase
          .from('members').select('*').eq('team_id', mem.team_id);
        const mems = allMembers ?? [];
        setMembers(mems);
        setMaps(buildMaps(mems));

        // load team
        const { data: t } = await supabase
          .from('teams').select('*').eq('id', mem.team_id).single();
        setTeam(t);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // ── load expenses when maps ready ─────────────────────────────────────────
  const refreshExpenses = useCallback(async () => {
    if (!team) return;
    setExpLoad(true);
    try {
      const { data } = await supabase
        .from('expenses').select('*').eq('team_id', team.id)
        .order('date', { ascending: false });
      const mapped = (data ?? []).map(e => dbToLocal(e as DbExpense, maps.byId));
      setExpenses(mapped);
    } finally {
      setExpLoad(false);
    }
  }, [team, maps]);

  useEffect(() => { refreshExpenses(); }, [refreshExpenses]);

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const addExpense = async (data: Omit<Expense, 'id' | 'paid'>) => {
    if (!team) return;
    await supabase.from('expenses').insert({
      team_id:      team.id,
      date:         data.date,
      description:  data.desc,
      category:     data.cat,
      amount:       data.amount,
      paid_by:      maps.byName[data.paidBy] ?? data.paidBy,
      split_among:  data.split.map(n => maps.byName[n] ?? n),
      notes:        data.note || null,
      is_settled:   false,
    });
    await refreshExpenses();
  };

  const updateExpense = async (id: string, data: Omit<Expense, 'id' | 'paid'>) => {
    await supabase.from('expenses').update({
      date:         data.date,
      description:  data.desc,
      category:     data.cat,
      amount:       data.amount,
      paid_by:      maps.byName[data.paidBy] ?? data.paidBy,
      split_among:  data.split.map(n => maps.byName[n] ?? n),
      notes:        data.note || null,
      updated_at:   new Date().toISOString(),
    }).eq('id', id);
    await refreshExpenses();
  };

  const deleteExpense = async (id: string) => {
    await supabase.from('expenses').delete().eq('id', id);
    setExpenses(p => p.filter(e => String(e.id) !== id));
  };

  const toggleSettled = async (id: string, current: boolean) => {
    await supabase.from('expenses').update({
      is_settled: !current,
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    setExpenses(p => p.map(e => String(e.id) === id ? { ...e, paid: !current } : e));
  };

  const signOut = async () => { await supabase.auth.signOut(); };

  const memberName = (uuid: string) => maps.byId[uuid] ?? uuid;
  const memberId   = (name: string) => maps.byName[name] ?? name;

  return (
    <Ctx.Provider value={{
      session, user, loading, signOut,
      team, members, currentMember,
      expenses, expensesLoading, refreshExpenses,
      addExpense, updateExpense, deleteExpense, toggleSettled,
      memberName, memberId,
    }}>
      {children}
    </Ctx.Provider>
  );
}
