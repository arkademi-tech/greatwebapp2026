import { createContext, useContext, useState, type ReactNode } from 'react'

interface Toast {
  id: number
  msg: string
  type: 'success' | 'error' | 'info'
}

interface AppCtx {
  toasts: Toast[]
  showToast: (msg: string, type?: Toast['type']) => void
}

const Ctx = createContext<AppCtx>({} as AppCtx)

export function AppProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = (msg: string, type: Toast['type'] = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }

  return <Ctx.Provider value={{ toasts, showToast }}>{children}</Ctx.Provider>
}

export const useApp = () => useContext(Ctx)
