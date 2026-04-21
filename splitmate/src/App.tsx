import { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import type { Expense, Page, ToastState } from './types';
import { Sidebar } from './components/Sidebar';
import { Toast } from './components/ui/Toast';
import { Dashboard } from './pages/Dashboard';
import { ExpenseList } from './pages/ExpenseList';
import { AddForm } from './pages/AddForm';
import { Recap } from './pages/Recap';
import { AuthPage } from './pages/auth/AuthPage';
import { OnboardPage } from './pages/auth/OnboardPage';

function AppShell() {
  const { session, loading, currentMember, expenses } = useApp();
  const [page, setPage]           = useState<Page>(() => (localStorage.getItem('sm_page') as Page) || 'dashboard');
  const [editTarget, setEditTarget] = useState<Expense | null>(null);
  const [toast, setToast]           = useState<ToastState | null>(null);
  const [mobile, setMobile]         = useState(window.innerWidth < 768);

  useEffect(() => {
    const h = () => setMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const nav = (p: Page) => { setPage(p); localStorage.setItem('sm_page', p); };
  const showToast = (msg: string, type: ToastState['type'] = 'success') => setToast({ msg, type });

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: '#F1F5F9' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
            <i className="fi fi-rr-coins flex items-center text-white text-xl" />
          </div>
          <div className="text-sm font-semibold text-slate-500">Memuat SplitMate…</div>
        </div>
      </div>
    );
  }

  if (!session) return <AuthPage />;
  if (!currentMember) return <OnboardPage />;

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {!mobile && <Sidebar page={page} setPage={nav} />}

      <main className="flex-1 overflow-hidden flex flex-col"
        style={{ background: '#F1F5F9', paddingBottom: mobile ? 60 : 0 }}>
        {page === 'dashboard' && <Dashboard expenses={expenses} setPage={nav} />}
        {page === 'expenses' && (
          <ExpenseList expenses={expenses} setPage={nav} setEditTarget={setEditTarget} showToast={showToast} />
        )}
        {page === 'add' && (
          <AddForm editTarget={editTarget} setEditTarget={setEditTarget} setPage={nav} showToast={showToast} />
        )}
        {page === 'recap' && (
          <Recap expenses={expenses} showToast={showToast} />
        )}
      </main>

      {mobile && <Sidebar page={page} setPage={nav} mobile />}
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
