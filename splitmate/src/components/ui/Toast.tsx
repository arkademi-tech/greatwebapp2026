import { useEffect } from 'react';
import type { ToastState } from '../../types';

interface ToastProps extends ToastState {
  onDone: () => void;
}

const cfg = {
  success: { bg: '#16A34A', icon: 'check-circle' },
  error:   { bg: '#DC2626', icon: 'cross-circle' },
  info:    { bg: '#2563EB', icon: 'info' },
};

export function Toast({ msg, type, onDone }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, []);

  const c = cfg[type];

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl text-white text-sm font-semibold shadow-2xl max-w-xs"
      style={{ background: c.bg, animation: 'slideUp 0.25s ease' }}
    >
      <i className={`fi fi-rr-${c.icon} flex items-center text-lg`} />
      {msg}
    </div>
  );
}
