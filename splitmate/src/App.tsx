import { useEffect, useState } from 'react';
import type { Expense, Page, ToastState } from './types';
import { INIT_EXPENSES } from './data';
import { Sidebar } from './components/Sidebar';
import { Toast } from './components/ui/Toast';
import { Dashboard } from './pages/Dashboard';
import { ExpenseList } from './pages/ExpenseList';
import { AddForm } from './pages/AddForm';
import { Recap } from './pages/Recap';

export default function App() {
  const [page, setPage] = useState<Page>(() => (localStorage.getItem('sm_page') as Page) || 'dashboard');
  const [expenses, setExpenses] = useState<Expense[]>(INIT_EXPENSES);
  const [editTarget, setEditTarget] = useState<Expense | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [mobile, setMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const h = () => setMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const nav = (p: Page) => { setPage(p); localStorage.setItem('sm_page', p); };
  const showToast = (msg: string, type: ToastState['type'] = 'success') => setToast({ msg, type });

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {!mobile && <Sidebar page={page} setPage={nav} />}

      <main
        className="flex-1 overflow-hidden flex flex-col"
        style={{ background: '#F1F5F9', paddingBottom: mobile ? 60 : 0 }}
      >
        {page === 'dashboard' && <Dashboard expenses={expenses} setPage={nav} />}
        {page === 'expenses' && (
          <ExpenseList
            expenses={expenses}
            setExpenses={setExpenses}
            setPage={nav}
            setEditTarget={setEditTarget}
            showToast={showToast}
          />
        )}
        {page === 'add' && (
          <AddForm
            expenses={expenses}
            setExpenses={setExpenses}
            editTarget={editTarget}
            setEditTarget={setEditTarget}
            setPage={nav}
            showToast={showToast}
          />
        )}
        {page === 'recap' && (
          <Recap expenses={expenses} setExpenses={setExpenses} showToast={showToast} />
        )}
      </main>

      {mobile && <Sidebar page={page} setPage={nav} mobile />}
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
