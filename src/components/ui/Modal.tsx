import { X } from 'lucide-react'
import { Button } from './Button'

interface Props {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'danger' | 'primary'
}

export function Modal({
  title, description, confirmLabel = 'Konfirmasi', cancelLabel = 'Batal',
  onConfirm, onCancel, variant = 'danger',
}: Props) {
  return (
    <div
      className="overlay-enter"
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(15,23,42,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400,
          boxShadow: '0 24px 64px rgba(15,23,42,0.2)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>{title}</h3>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
            <X size={18} />
          </button>
        </div>
        {description && <p style={{ fontSize: 13, color: '#64748B', marginBottom: 20, lineHeight: 1.6 }}>{description}</p>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onCancel}>{cancelLabel}</Button>
          <Button variant={variant} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  )
}
