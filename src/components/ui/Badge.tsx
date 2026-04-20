type Color = 'blue' | 'green' | 'red' | 'amber' | 'grey'

interface Props {
  children: React.ReactNode
  color?: Color
  dot?: boolean
}

const styles: Record<Color, { bg: string; c: string }> = {
  blue:  { bg: '#EFF6FF', c: '#2563EB' },
  green: { bg: '#F0FDF4', c: '#16A34A' },
  red:   { bg: '#FEF2F2', c: '#DC2626' },
  amber: { bg: '#FFFBEB', c: '#D97706' },
  grey:  { bg: '#F1F5F9', c: '#64748B' },
}

export function Badge({ children, color = 'grey', dot }: Props) {
  const s = styles[color]
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '3px 10px', borderRadius: 99,
        fontSize: 12, fontWeight: 600,
        background: s.bg, color: s.c,
        whiteSpace: 'nowrap',
      }}
    >
      {dot && (
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.c, flexShrink: 0 }} />
      )}
      {children}
    </span>
  )
}
