const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4']

interface Props {
  name: string
  size?: number
  index?: number
}

export function Avatar({ name, size = 28, index }: Props) {
  const i = index !== undefined ? index % COLORS.length : name.charCodeAt(0) % COLORS.length
  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%',
        background: COLORS[i],
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.42, fontWeight: 700, color: '#fff', flexShrink: 0,
      }}
    >
      {(name || '?')[0].toUpperCase()}
    </div>
  )
}
