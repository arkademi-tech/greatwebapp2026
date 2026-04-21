export interface DbTeam {
  id: string;
  name: string;
  share_token: string;
  created_at: string;
}

export interface DbMember {
  id: string;
  team_id: string;
  name: string;
  user_id: string | null;
  created_at: string;
}

export interface DbExpense {
  id: string;
  team_id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  paid_by: string;        // member uuid
  split_among: string[];  // member uuids
  notes: string | null;
  attachment_url: string | null;
  is_settled: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbSettlement {
  id: string;
  team_id: string;
  from_member: string;
  to_member: string;
  amount: number;
  period: string;
  is_paid: boolean;
  paid_at: string | null;
  created_at: string;
}
