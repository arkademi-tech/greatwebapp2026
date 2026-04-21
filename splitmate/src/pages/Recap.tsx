import { useState } from 'react';
import type { Expense } from '../types';
import { CAT_COLORS } from '../data';
import { fmt } from '../utils';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { PageHeader } from '../components/PageHeader';
import { useApp } from '../context/AppContext';

interface RecapProps {
  expenses: Expense[];
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

interface Settlement { from: string; to: string; amount: number; }

function computeBalances(expenses: Expense[], memberNames: string[]) {
  const bal: Record<string, number> = {};
  memberNames.forEach(m => (bal[m] = 0));
  expenses.filter(e => !e.paid).forEach(e => {
    if (bal[e.paidBy] !== undefined) bal[e.paidBy] += e.amount;
    e.split.forEach(m => { if (bal[m] !== undefined) bal[m] -= e.amount / e.split.length; });
  });
  return bal;
}

function simplifyDebts(bal: Record<string, number>): Settlement[] {
  const b = { ...bal };
  const txs: Settlement[] = [];
  for (let i = 0; i < 20; i++) {
    const keys = Object.keys(b);
    const creditor = keys.reduce((a, k) => (b[k] > b[a] ? k : a));
    const debtor   = keys.reduce((a, k) => (b[k] < b[a] ? k : a));
    if (b[creditor] < 1) break;
    const amt = Math.min(b[creditor], -b[debtor]);
    txs.push({ from: debtor, to: creditor, amount: Math.round(amt) });
    b[creditor] -= amt;
    b[debtor]   += amt;
  }
  return txs;
}

export function Recap({ expenses, showToast }: RecapProps) {
  const { members, toggleSettled } = useApp();
  const memberNames = members.map(m => m.name);

  const bal = computeBalances(expenses, memberNames);
  const settlements = simplifyDebts(bal);
  const [marked, setMarked] = useState<number[]>([]);

  const markLunas = (idx: number) => {
    setMarked(p => [...p, idx]);
    showToast('Pembayaran ditandai lunas ✓', 'success');
  };

  const totalUnpaid = expenses.filter(e => !e.paid).reduce((s, e) => s + e.amount, 0);
  const unpaidExpenses = expenses.filter(e => !e.paid);

  return (
    <div className="overflow-auto h-full p-7">
      <PageHeader
        title="Rekap & Hutang"
        subtitle="Siapa yang harus transfer ke siapa"
        action={<Button variant="secondary" icon="file-export">Export PDF</Button>}
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { icon: 'coins', color: '#DC2626', bg: '#FEF2F2', val: fmt(totalUnpaid), label: 'Belum Dilunasi', sub: `${unpaidExpenses.length} transaksi` },
          { icon: 'arrows-repeat', color: '#2563EB', bg: '#EFF6FF', val: `${settlements.length} transfer`, label: 'Penyelesaian', sub: 'untuk lunas semua hutang' },
          { icon: 'check-circle', color: '#16A34A', bg: '#F0FDF4', val: `${marked.length}/${settlements.length}`, label: 'Sudah Lunas', sub: 'transfer dikonfirmasi' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: c.bg }}>
              <i className={`fi fi-rr-${c.icon} flex items-center`} style={{ color: c.color }} />
            </div>
            <div className="text-xl font-extrabold text-slate-900">{c.val}</div>
            <div className="text-xs text-slate-500 mt-1">{c.label}</div>
            <div className="text-xs text-slate-400">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Balance per member */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5 shadow-sm">
        <div className="text-sm font-bold text-slate-900 mb-4">Saldo Bersih Anggota</div>
        {memberNames.length === 0 ? (
          <div className="text-sm text-slate-400 text-center py-6">Belum ada anggota</div>
        ) : (
          <div className="flex gap-3 flex-wrap">
            {memberNames.map(m => {
              const v = Math.round(bal[m] ?? 0);
              const isPos = v >= 0;
              return (
                <div key={m} className="flex-1 min-w-[140px] rounded-xl p-4 border"
                  style={{ background: isPos ? '#F0FDF4' : '#FEF2F2', borderColor: isPos ? '#DCFCE7' : '#FEE2E2' }}>
                  <div className="flex items-center gap-2 mb-2.5">
                    <Avatar name={m} size={32} />
                    <div className="text-sm font-bold text-slate-900">{m}</div>
                  </div>
                  <div className="text-lg font-extrabold tracking-tight" style={{ color: isPos ? '#16A34A' : '#DC2626' }}>
                    {isPos ? '+' : ''}{fmt(Math.abs(v))}
                  </div>
                  <div className="text-xs font-medium mt-0.5" style={{ color: isPos ? '#166534' : '#991B1B' }}>
                    {isPos ? 'Akan menerima' : 'Harus membayar'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Settlement table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm mb-5">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <div className="text-sm font-bold text-slate-900">Rencana Penyelesaian</div>
          <Badge color="blue">{settlements.length} transfer</Badge>
        </div>

        {settlements.length === 0 ? (
          <div className="py-12 px-6 text-center">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
              <i className="fi fi-rr-party-horn flex items-center text-green-600 text-2xl" />
            </div>
            <div className="text-base font-bold text-slate-900">Semua lunas! 🎉</div>
            <div className="text-sm text-slate-500 mt-1">Tidak ada hutang yang perlu diselesaikan.</div>
          </div>
        ) : settlements.map((s, i) => {
          const done = marked.includes(i);
          return (
            <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-slate-100 last:border-0 transition-opacity"
              style={{ opacity: done ? 0.6 : 1 }}>
              <div className="flex items-center gap-2.5 flex-1">
                <Avatar name={s.from} size={36} />
                <div>
                  <div className="text-sm font-bold text-slate-900">{s.from}</div>
                  <div className="text-xs text-slate-400">Pengirim</div>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="text-base font-extrabold text-slate-900 tracking-tight">{fmt(s.amount)}</div>
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-px bg-slate-300" />
                  <i className="fi fi-rr-arrow-right flex items-center text-blue-600 text-sm" />
                  <div className="w-6 h-px bg-slate-300" />
                </div>
                <div className="text-[10px] text-slate-400 font-medium">Transfer via</div>
              </div>
              <div className="flex items-center gap-2.5 flex-1 justify-end">
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-900">{s.to}</div>
                  <div className="text-xs text-slate-400">Penerima</div>
                </div>
                <Avatar name={s.to} size={36} />
              </div>
              <div className="ml-4">
                {done ? <Badge color="green" dot>Lunas</Badge>
                  : <Button size="sm" variant="success" icon="check" onClick={() => markLunas(i)}>Tandai Lunas</Button>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Unpaid detail */}
      {unpaidExpenses.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200 text-sm font-bold text-slate-900">
            Detail Transaksi Belum Lunas
          </div>
          {unpaidExpenses.map(e => (
            <div key={e.id} className="flex items-center gap-3.5 px-6 py-3.5 border-b border-slate-100 last:border-0">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: CAT_COLORS[e.cat] + '18' }}>
                <i className="fi fi-rr-receipt flex items-center text-sm" style={{ color: CAT_COLORS[e.cat] }} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-slate-900">{e.desc}</div>
                <div className="text-xs text-slate-400 mt-0.5">{e.date} · {e.split.join(', ')}</div>
              </div>
              <div className="text-sm font-bold text-slate-900">{fmt(e.amount)}</div>
              <div className="flex items-center gap-1.5">
                <Avatar name={e.paidBy} size={20} />
                <span className="text-xs text-slate-600">{e.paidBy}</span>
              </div>
              <Button size="sm" variant="success"
                onClick={() => { toggleSettled(e.id, false); showToast('Ditandai lunas', 'success'); }}>
                Lunas
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
