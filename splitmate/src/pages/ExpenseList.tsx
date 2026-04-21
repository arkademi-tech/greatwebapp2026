import { useState } from 'react';
import type { Expense, Page } from '../types';
import { CATS, CAT_COLORS } from '../data';
import { fmt } from '../utils';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { SkeletonTable } from '../components/ui/Skeleton';
import { PageHeader } from '../components/PageHeader';
import { useApp } from '../context/AppContext';

interface ExpenseListProps {
  expenses: Expense[];
  setPage: (p: Page) => void;
  setEditTarget: (e: Expense | null) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const PER_PAGE = 5;

export function ExpenseList({ expenses, setPage, setEditTarget, showToast }: ExpenseListProps) {
  const { deleteExpense, toggleSettled, refreshExpenses } = useApp();
  const [q, setQ] = useState('');
  const [catFilter, setCatFilter] = useState('Semua');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [loading, setLoading] = useState(false);
  const [pg, setPg] = useState(1);

  const filtered = expenses.filter(e => {
    const mq = !q || e.desc.toLowerCase().includes(q.toLowerCase()) || e.paidBy.toLowerCase().includes(q.toLowerCase());
    const mc = catFilter === 'Semua' || e.cat === catFilter;
    const ms = statusFilter === 'Semua' || (statusFilter === 'Lunas' && e.paid) || (statusFilter === 'Belum' && !e.paid);
    return mq && mc && ms;
  });

  const pages = Math.ceil(filtered.length / PER_PAGE);
  const rows = filtered.slice((pg - 1) * PER_PAGE, pg * PER_PAGE);

  const del = async (id: string) => {
    await deleteExpense(id);
    showToast('Pengeluaran dihapus', 'success');
  };

  const toggle = async (id: string, current: boolean) => {
    await toggleSettled(id, current);
    showToast('Status diperbarui', 'success');
  };

  const reload = async () => {
    setLoading(true);
    await refreshExpenses();
    setLoading(false);
  };

  const catBadgeColor = (cat: string) => cat === 'Makan' ? 'amber' : cat === 'Tools' ? 'blue' : 'grey';

  return (
    <div className="overflow-auto h-full p-7">
      <PageHeader
        title="Daftar Pengeluaran"
        subtitle={`${expenses.length} total transaksi tim`}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" icon="refresh" size="sm" onClick={reload}>Refresh</Button>
            <Button icon="plus" onClick={() => setPage('add')}>Tambah Baru</Button>
          </div>
        }
      />

      <div className="flex gap-2.5 mb-4 flex-wrap items-center">
        <div className="relative flex-1 min-w-52 max-w-xs">
          <i className="fi fi-rr-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none flex items-center" />
          <input value={q} onChange={e => { setQ(e.target.value); setPg(1); }}
            placeholder="Cari pengeluaran…"
            className="w-full h-9 rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 focus:outline-none focus:border-blue-500 transition-colors" />
        </div>

        {['Semua', ...CATS].map(c => (
          <button key={c} onClick={() => { setCatFilter(c); setPg(1); }}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all"
            style={{
              border: `1px solid ${catFilter === c ? '#2563EB' : '#CBD5E1'}`,
              background: catFilter === c ? '#EFF6FF' : 'white',
              color: catFilter === c ? '#2563EB' : '#64748B',
            }}>
            {c}
          </button>
        ))}

        <div className="flex gap-1.5 ml-auto">
          {['Semua', 'Lunas', 'Belum'].map(s => {
            const active = statusFilter === s;
            const activeColor = s === 'Lunas' ? '#16A34A' : s === 'Belum' ? '#DC2626' : '#2563EB';
            const activeBg = s === 'Lunas' ? '#F0FDF4' : s === 'Belum' ? '#FEF2F2' : '#EFF6FF';
            return (
              <button key={s} onClick={() => { setStatusFilter(s); setPg(1); }}
                className="px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all"
                style={{
                  border: `1px solid ${active ? activeColor : '#CBD5E1'}`,
                  background: active ? activeBg : 'white',
                  color: active ? activeColor : '#64748B',
                }}>
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? <SkeletonTable /> : rows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 py-16 px-6 text-center flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-1">
            <i className="fi fi-rr-receipt text-blue-600 flex items-center text-3xl" />
          </div>
          <div className="text-base font-bold text-slate-900">Tidak ada pengeluaran</div>
          <div className="text-sm text-slate-500 max-w-xs">Coba ubah filter atau tambahkan pengeluaran baru untuk tim kamu.</div>
          <Button icon="plus" size="sm" onClick={() => setPage('add')} className="mt-2">Tambah Pengeluaran</Button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="grid gap-3 px-4 py-2.5 border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider"
            style={{ gridTemplateColumns: '100px 1fr 100px 120px 110px 110px 120px' }}>
            {['Tanggal', 'Deskripsi', 'Kategori', 'Nominal', 'Dibayar', 'Status', 'Aksi'].map(h => <div key={h}>{h}</div>)}
          </div>

          {rows.map(e => (
            <div key={e.id}
              className="grid gap-3 px-4 py-3.5 border-b border-slate-100 items-center last:border-0 hover:bg-slate-50 transition-colors"
              style={{ gridTemplateColumns: '100px 1fr 100px 120px 110px 110px 120px' }}>
              <div className="text-xs text-slate-500">{e.date.slice(5).replace('-', '/')}</div>
              <div>
                <div className="text-sm font-semibold text-slate-900 truncate">{e.desc}</div>
                {e.note && <div className="text-xs text-slate-400 mt-0.5">{e.note}</div>}
              </div>
              <div><Badge color={catBadgeColor(e.cat) as 'amber' | 'blue' | 'grey'}>{e.cat}</Badge></div>
              <div className="text-sm font-bold text-slate-900">{fmt(e.amount)}</div>
              <div className="flex items-center gap-1.5">
                <Avatar name={e.paidBy} size={20} />
                <span className="text-xs text-slate-700">{e.paidBy}</span>
              </div>
              <div>
                <button onClick={() => toggle(e.id, e.paid)} className="bg-none border-none cursor-pointer p-0">
                  <Badge color={e.paid ? 'green' : 'red'} dot>{e.paid ? 'Lunas' : 'Belum'}</Badge>
                </button>
              </div>
              <div className="flex gap-1.5">
                <Button size="sm" variant="secondary" icon="pencil" onClick={() => { setEditTarget(e); setPage('add'); }} />
                <Button size="sm" variant="danger" icon="trash" onClick={() => del(e.id)} />
              </div>
            </div>
          ))}

          {pages > 1 && (
            <div className="flex justify-between items-center px-4 py-3 border-t border-slate-200">
              <span className="text-xs text-slate-500">
                Menampilkan {(pg - 1) * PER_PAGE + 1}–{Math.min(pg * PER_PAGE, filtered.length)} dari {filtered.length}
              </span>
              <div className="flex gap-1">
                <Button size="sm" variant="secondary" icon="angle-left" onClick={() => setPg(p => Math.max(1, p - 1))} disabled={pg === 1} />
                {Array.from({ length: pages }, (_, i) => i + 1).map(i => (
                  <button key={i} onClick={() => setPg(i)}
                    className="w-8 h-8 rounded-lg border text-sm font-semibold cursor-pointer transition-all"
                    style={{ border: `1px solid ${i === pg ? '#2563EB' : '#CBD5E1'}`, background: i === pg ? '#2563EB' : 'white', color: i === pg ? '#fff' : '#334155' }}>
                    {i}
                  </button>
                ))}
                <Button size="sm" variant="secondary" icon="angle-right" onClick={() => setPg(p => Math.min(pages, p + 1))} disabled={pg === pages} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
