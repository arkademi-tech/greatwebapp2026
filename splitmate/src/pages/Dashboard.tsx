import type { Expense, Page } from '../types';
import { CATS, CAT_COLORS } from '../data';
import { fmt, fmtK } from '../utils';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { PageHeader } from '../components/PageHeader';
import { useApp } from '../context/AppContext';

interface StatCardProps {
  label: string;
  value: string;
  sub: string;
  icon: string;
  color: string;
  trend?: number;
}

function StatCard({ label, value, sub, icon, color, trend }: StatCardProps) {
  return (
    <div className="flex-1 min-w-[180px] bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: color + '18' }}>
          <i className={`fi fi-rr-${icon} flex items-center text-base`} style={{ color }} />
        </div>
        {trend !== undefined && (
          <span className="text-xs font-semibold" style={{ color: trend > 0 ? '#16A34A' : '#DC2626' }}>
            {Math.abs(trend)}% bulan ini
          </span>
        )}
      </div>
      <div className="text-xl font-extrabold text-slate-900 tracking-tight">{value}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
      <div className="text-xs text-slate-400 mt-0.5">{sub}</div>
    </div>
  );
}

function BarChart({ data }: { data: { label: string; val: number; color: string }[] }) {
  const max = Math.max(...data.map(d => d.val), 1);
  return (
    <div className="flex flex-col gap-2.5">
      {data.map(d => (
        <div key={d.label} className="flex items-center gap-2.5">
          <div className="w-20 text-xs text-slate-500 font-medium shrink-0">{d.label}</div>
          <div className="flex-1 h-7 bg-slate-50 rounded-md overflow-hidden relative">
            <div
              className="h-full rounded-md flex items-center pl-2.5 transition-all duration-700"
              style={{ width: `${(d.val / max) * 100}%`, background: d.color }}
            >
              {(d.val / max) > 0.25 && <span className="text-[11px] font-bold text-white">{fmtK(d.val)}</span>}
            </div>
            {(d.val / max) <= 0.25 && (
              <span className="absolute top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-700"
                style={{ left: `${(d.val / max) * 100 + 2}%` }}>
                {fmtK(d.val)}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

interface DashboardProps {
  expenses: Expense[];
  setPage: (p: Page) => void;
}

export function Dashboard({ expenses, setPage }: DashboardProps) {
  const { members, team } = useApp();
  const memberNames = members.map(m => m.name);

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const lunas = expenses.filter(e => e.paid).reduce((s, e) => s + e.amount, 0);
  const belum = total - lunas;
  const recent = [...expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const catData = CATS
    .map(c => ({ label: c, val: expenses.filter(e => e.cat === c).reduce((s, e) => s + e.amount, 0), color: CAT_COLORS[c] }))
    .filter(d => d.val > 0).sort((a, b) => b.val - a.val);

  const subtitle = team
    ? `Ringkasan keuangan ${team.name}`
    : 'Ringkasan keuangan tim';

  const catBadgeColor = (cat: string) => cat === 'Makan' ? 'amber' : cat === 'Tools' ? 'blue' : 'grey';

  return (
    <div className="overflow-auto h-full p-7">
      <PageHeader
        title="Dashboard"
        subtitle={subtitle}
        action={<Button icon="plus" onClick={() => setPage('add')}>Tambah Pengeluaran</Button>}
      />

      <div className="flex gap-4 mb-6 flex-wrap">
        <StatCard label="Total Pengeluaran" value={fmt(total)} sub={`${expenses.length} transaksi`} icon="coins" color="#2563EB" trend={12} />
        <StatCard label="Sudah Lunas" value={fmt(lunas)} sub={`${expenses.filter(e => e.paid).length} item`} icon="check-circle" color="#16A34A" />
        <StatCard label="Belum Lunas" value={fmt(belum)} sub={`${expenses.filter(e => !e.paid).length} item menunggu`} icon="clock" color="#DC2626" />
        <StatCard label="Rata-rata/Orang" value={fmt(memberNames.length ? Math.round(total / memberNames.length) : 0)} sub="bulan ini" icon="user" color="#D97706" />
      </div>

      <div className="grid grid-cols-2 gap-5 mb-5">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-5">
            <div className="text-sm font-bold text-slate-900">Pengeluaran per Kategori</div>
            <Badge color="grey">{new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</Badge>
          </div>
          {catData.length > 0 ? <BarChart data={catData} /> : (
            <div className="text-sm text-slate-400 text-center py-8">Belum ada data</div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="text-sm font-bold text-slate-900 mb-5">Kontribusi Anggota</div>
          {memberNames.length === 0 ? (
            <div className="text-sm text-slate-400 text-center py-8">Belum ada anggota</div>
          ) : memberNames.map(m => {
            const paid = expenses.filter(e => e.paidBy === m).reduce((s, e) => s + e.amount, 0);
            const share = expenses.filter(e => e.split.includes(m)).reduce((s, e) => s + e.amount / e.split.length, 0);
            const diff = paid - share;
            return (
              <div key={m} className="flex items-center gap-3 mb-3.5 last:mb-0">
                <Avatar name={m} size={34} />
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-semibold text-slate-900">{m}</span>
                    <span className="text-xs font-bold" style={{ color: diff >= 0 ? '#16A34A' : '#DC2626' }}>
                      {diff >= 0 ? '+' : ''}{fmtK(Math.round(diff))}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${Math.min(100, total > 0 ? (paid / total) * 100 : 0)}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm font-bold text-slate-900">Transaksi Terbaru</div>
          <Button variant="ghost" size="sm" icon="arrow-right" onClick={() => setPage('expenses')}>Lihat semua</Button>
        </div>
        {recent.length === 0 ? (
          <div className="text-sm text-slate-400 text-center py-8">Belum ada transaksi</div>
        ) : (
          <div className="flex flex-col">
            {recent.map(e => (
              <div key={e.id} className="flex items-center gap-3.5 py-2.5 border-b border-slate-100 last:border-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: CAT_COLORS[e.cat] + '18' }}>
                  <i className="fi fi-rr-receipt flex items-center text-sm" style={{ color: CAT_COLORS[e.cat] }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-900 truncate">{e.desc}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {e.date} · Dibayar <strong className="text-slate-600">{e.paidBy}</strong>
                  </div>
                </div>
                <Badge color={catBadgeColor(e.cat) as 'amber' | 'blue' | 'grey'}>{e.cat}</Badge>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-slate-900">{fmt(e.amount)}</div>
                  <Badge color={e.paid ? 'green' : 'red'} dot>{e.paid ? 'Lunas' : 'Belum'}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
