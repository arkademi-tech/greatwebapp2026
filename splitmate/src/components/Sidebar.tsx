import type { Page } from '../types';
import { useApp } from '../context/AppContext';

const NAV: { id: Page; icon: string; label: string }[] = [
  { id: 'dashboard', icon: 'home',      label: 'Dashboard' },
  { id: 'expenses',  icon: 'receipt',   label: 'Pengeluaran' },
  { id: 'add',       icon: 'plus',      label: 'Tambah Baru' },
  { id: 'recap',     icon: 'chart-pie', label: 'Rekap & Hutang' },
];

interface SidebarProps {
  page: Page;
  setPage: (p: Page) => void;
  mobile?: boolean;
}

export function Sidebar({ page, setPage, mobile }: SidebarProps) {
  const { team, members, currentMember, signOut } = useApp();

  if (mobile) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 h-15 flex border-t z-40"
        style={{ background: '#0F172A', borderColor: '#334155' }}>
        {NAV.map(n => {
          const active = page === n.id;
          return (
            <button key={n.id} onClick={() => setPage(n.id)}
              className="flex-1 flex flex-col items-center justify-center gap-1 border-none cursor-pointer transition-all"
              style={{ background: 'none', color: active ? '#2563EB' : '#94A3B8' }}>
              <i className={`fi fi-rr-${n.icon} flex items-center text-base`} />
              <span className="text-[10px] font-semibold">{n.label}</span>
            </button>
          );
        })}
      </nav>
    );
  }

  return (
    <aside className="flex flex-col w-56 shrink-0 h-full" style={{ background: '#0F172A' }}>
      {/* Logo */}
      <div className="px-5 py-5 border-b" style={{ borderColor: '#1E293B' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <i className="fi fi-rr-coins text-white flex items-center text-sm" />
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-none">SplitMate</div>
            <div className="text-xs mt-0.5 truncate max-w-[120px]" style={{ color: '#64748B' }}>
              {team?.name ?? 'Kelola bersama'}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV.map(n => {
          const active = page === n.id;
          return (
            <button key={n.id} onClick={() => setPage(n.id)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-left cursor-pointer border-none transition-all font-medium text-sm"
              style={{ background: active ? '#1E3A5F' : 'transparent', color: active ? '#60A5FA' : '#94A3B8' }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = '#1E293B'; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
              <i className={`fi fi-rr-${n.icon} flex items-center text-base`} />
              {n.label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t" style={{ borderColor: '#1E293B' }}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {(currentMember?.name ?? 'U')[0]}
            </div>
            <div className="min-w-0">
              <div className="text-white text-xs font-semibold truncate">{currentMember?.name ?? 'User'}</div>
              <div className="text-[10px]" style={{ color: '#64748B' }}>{members.length} anggota</div>
            </div>
          </div>
          <button onClick={signOut} title="Keluar"
            className="text-slate-500 hover:text-red-400 transition-colors cursor-pointer bg-none border-none shrink-0">
            <i className="fi fi-rr-sign-out flex items-center text-base" />
          </button>
        </div>
      </div>
    </aside>
  );
}
