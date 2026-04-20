import { CheckCircle, XCircle, Info } from 'lucide-react'

interface Props {
  msg: string
  type: 'success' | 'error' | 'info'
}

const cfg = {
  success: { bg: '#16A34A', Icon: CheckCircle },
  error:   { bg: '#DC2626', Icon: XCircle },
  info:    { bg: '#2563EB', Icon: Info },
}

export function Toast({ msg, type }: Props) {
  const { bg, Icon } = cfg[type]
  return (
    <div
      className="toast-enter"
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: bg, color: '#fff',
        borderRadius: 12, padding: '12px 18px',
        fontSize: 13, fontWeight: 600,
        boxShadow: '0 12px 32px rgba(15,23,42,0.2)',
        maxWidth: 320,
      }}
    >
      <Icon size={18} />
      {msg}
    </div>
  )
}

export function ToastContainer({ toasts }: { toasts: { id: number; msg: string; type: 'success' | 'error' | 'info' }[] }) {
  if (!toasts.length) return null
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => <Toast key={t.id} msg={t.msg} type={t.type} />)}
    </div>
  )
}
