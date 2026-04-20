export type Database = {
  public: {
    Tables: {
      teams: {
        Row:    Team
        Insert: Omit<Team, 'id' | 'share_token' | 'created_at'>
        Update: Partial<Omit<Team, 'id' | 'created_at'>>
      }
      members: {
        Row:    Member
        Insert: Omit<Member, 'id' | 'created_at'>
        Update: Partial<Omit<Member, 'id' | 'created_at'>>
      }
      expenses: {
        Row:    Expense
        Insert: Omit<Expense, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Expense, 'id' | 'created_at'>>
      }
      settlements: {
        Row:    Settlement
        Insert: Omit<Settlement, 'id' | 'created_at'>
        Update: Partial<Omit<Settlement, 'id' | 'created_at'>>
      }
    }
  }
}

export interface Team {
  id: string
  name: string
  share_token: string
  created_at: string
}

export interface Member {
  id: string
  team_id: string
  name: string
  created_at: string
}

export interface Expense {
  id: string
  team_id: string
  date: string
  description: string
  category: Category
  amount: number
  paid_by: string
  split_among: string[]
  notes: string | null
  attachment_url: string | null
  is_settled: boolean
  created_at: string
  updated_at: string
}

export interface Settlement {
  id: string
  team_id: string
  from_member: string
  to_member: string
  amount: number
  period: string
  is_paid: boolean
  paid_at: string | null
  created_at: string
}

export type Category =
  | 'Hosting & Domain'
  | 'Software & Tools'
  | 'Peralatan Kerja'
  | 'Transport'
  | 'Konsumsi Rapat'
  | 'Lain-lain'

export const CATEGORIES: Category[] = [
  'Hosting & Domain',
  'Software & Tools',
  'Peralatan Kerja',
  'Transport',
  'Konsumsi Rapat',
  'Lain-lain',
]

export const CATEGORY_COLORS: Record<Category, string> = {
  'Hosting & Domain':  '#0891B2',
  'Software & Tools':  '#2563EB',
  'Peralatan Kerja':   '#7C3AED',
  'Transport':         '#8B5CF6',
  'Konsumsi Rapat':    '#F97316',
  'Lain-lain':         '#64748B',
}
