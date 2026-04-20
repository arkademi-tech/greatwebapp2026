import type { LucideIcon } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
type Size = 'sm' | 'md' | 'lg'

interface Props {
  children?: React.ReactNode
  variant?: Variant
  size?: Size
  Icon?: LucideIcon
  iconRight?: LucideIcon
  onClick?: () => void
  disabled?: boolean
  full?: boolean
  type?: 'button' | 'submit'
  className?: string
}

const sz: Record<Size, { h: number; px: number; fs: number }> = {
  sm: { h: 32, px: 12, fs: 12 },
  md: { h: 38, px: 16, fs: 13 },
  lg: { h: 44, px: 20, fs: 14 },
}

const variants: Record<Variant, React.CSSProperties> = {
  primary:   { background: '#2563EB', color: '#fff', border: 'none' },
  secondary: { background: '#fff', color: '#334155', border: '1px solid #CBD5E1' },
  ghost:     { background: 'transparent', color: '#64748B', border: 'none' },
  danger:    { background: '#FEF2F2', color: '#DC2626', border: '1px solid #FEE2E2' },
  success:   { background: '#F0FDF4', color: '#16A34A', border: '1px solid #DCFCE7' },
}

export function Button({
  children, variant = 'primary', size = 'md',
  Icon, iconRight: IconRight, onClick, disabled, full, type = 'button', className,
}: Props) {
  const s = sz[size]
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        height: s.h, padding: `0 ${s.px}px`,
        borderRadius: 8, fontSize: s.fs, fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 150ms',
        width: full ? '100%' : undefined,
        fontFamily: 'inherit',
        ...variants[variant],
      }}
    >
      {Icon && <Icon size={s.fs + 1} />}
      {children}
      {IconRight && <IconRight size={s.fs + 1} />}
    </button>
  )
}
