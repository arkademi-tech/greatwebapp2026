interface SkProps { w?: string | number; h?: number; r?: number }

export function Sk({ w = '100%', h = 16, r = 6 }: SkProps) {
  return <div className="skeleton" style={{ width: w, height: h, borderRadius: r }} />
}

export function SkeletonCard() {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 22, border: '1px solid #E2E8F0', flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Sk w={120} h={12} />
        <Sk w={36} h={36} r={10} />
      </div>
      <Sk w={140} h={28} r={8} />
      <div style={{ marginTop: 8 }}><Sk w={90} h={12} /></div>
    </div>
  )
}

export function SkeletonTable() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
      {Array(6).fill(0).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #F1F5F9' }}>
          <Sk w={80} h={12} />
          <Sk w="30%" h={12} />
          <Sk w={70} h={22} r={99} />
          <Sk w={90} h={12} />
          <Sk w={100} h={12} />
          <Sk w={70} h={28} r={8} />
        </div>
      ))}
    </div>
  )
}
