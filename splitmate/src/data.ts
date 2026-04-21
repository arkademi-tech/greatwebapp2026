import type { Expense } from './types';

export const MEMBERS = ['Andi', 'Bela', 'Ciko', 'Dika'];

export const CATS = ['Makan', 'Transport', 'Tools', 'Sewa', 'Marketing', 'Lainnya'];

export const CAT_COLORS: Record<string, string> = {
  Makan: '#F97316',
  Transport: '#8B5CF6',
  Tools: '#2563EB',
  Sewa: '#0891B2',
  Marketing: '#D97706',
  Lainnya: '#64748B',
};

export const INIT_EXPENSES: Expense[] = [
  { id: 1, date: '2025-04-01', desc: 'Makan siang diskusi project', cat: 'Makan', amount: 320000, paidBy: 'Andi', split: ['Andi', 'Bela', 'Ciko'], note: '', paid: true },
  { id: 2, date: '2025-04-03', desc: 'Domain & hosting bulanan', cat: 'Tools', amount: 550000, paidBy: 'Bela', split: ['Andi', 'Bela', 'Ciko', 'Dika'], note: 'Annual renewal', paid: false },
  { id: 3, date: '2025-04-05', desc: 'Grab ke klien', cat: 'Transport', amount: 85000, paidBy: 'Ciko', split: ['Ciko', 'Dika'], note: '', paid: true },
  { id: 4, date: '2025-04-07', desc: 'Figma Pro subscription', cat: 'Tools', amount: 210000, paidBy: 'Andi', split: ['Andi', 'Bela', 'Ciko', 'Dika'], note: 'Monthly', paid: false },
  { id: 5, date: '2025-04-09', desc: 'Sewa coworking space', cat: 'Sewa', amount: 900000, paidBy: 'Dika', split: ['Andi', 'Bela', 'Ciko', 'Dika'], note: 'April 2025', paid: false },
  { id: 6, date: '2025-04-10', desc: 'Makan malam after present', cat: 'Makan', amount: 480000, paidBy: 'Bela', split: ['Andi', 'Bela', 'Dika'], note: '', paid: true },
  { id: 7, date: '2025-04-12', desc: 'Google Workspace', cat: 'Tools', amount: 350000, paidBy: 'Ciko', split: ['Andi', 'Bela', 'Ciko', 'Dika'], note: '', paid: false },
  { id: 8, date: '2025-04-14', desc: 'Instagram Ads campaign', cat: 'Marketing', amount: 1200000, paidBy: 'Andi', split: ['Andi', 'Bela', 'Ciko', 'Dika'], note: 'Q2 campaign', paid: false },
];
