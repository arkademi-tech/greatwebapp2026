export interface Expense {
  id: number;
  date: string;
  desc: string;
  cat: string;
  amount: number;
  paidBy: string;
  split: string[];
  note: string;
  paid: boolean;
}

export type Page = 'dashboard' | 'expenses' | 'add' | 'recap';

export interface ToastState {
  msg: string;
  type: 'success' | 'error' | 'info';
}
