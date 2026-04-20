import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Coins, CheckCircle, Clock, User, Plus, ArrowRight } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { SkeletonCard } from '../components/ui/Skeleton'
import { useTeam } from '../context/TeamContext'
import { useExpenses } from '../hooks/useExpenses'
import { fmt, fmtK, fmtDate, periodLabel, currentPeriod } from '../lib/utils'
import { CATEGORY_COLORS } from '../types/database'

export function DashboardPage() {
  const navigate = useNavigate()
  const { team, members } = useTeam()
  const { expenses, loading } = useExpenses(team?.id)
  const period = currentPeriod()

  const monthExpenses = useMemo(() =>
    expenses.filter(e => e.date.startsWith(period.slice(0, 7))),
    [expenses, period]
  )

  const total  = monthExpenses.reduce((s, e) => s + e.amount, 0)
  const lunas  = monthExpenses.filter(e => e.is_settled).reduce((s, e) => s + e.amount, 0)
  const belum  = total - lunas
  const avgPerMember = members.length ? Math.round(total / members.length) : 0

  const catDataFixed = useMemo(() => {
    const map: Record<string, number> = {}
    monthExpenses.forEach(e => { map[e.category] = (map[e.category] ?? 0) + e.amount })
    return Object.entries(map)
      .map(([label, val]) => ({ label, val, color: (CATEGORY_COLORS as Record<string, string>)[label] ?? '#64748B' }))
      .sort((a, b) => b.val - a.val)
      .slice(0, 6)
  }, [monthExpenses])

  const recent = [...monthExpenses].slice(0, 5)

  const memberStats = members.map(m => {
    const paid  = monthExpenses.filter(e => e.paid_by === m.id).reduce((s, e) => s + e.amount, 0)
    const share = monthExpenses
      .filter(e => e.split_among.includes(m.id))
      .reduce((s, e) => s + e.amount / e.split_among.length, 0)
    return { member: m, paid, share, diff: paid - share }
  })

  const maxPaid = Math.max(...memberStats.map(s => s.paid), 1)

  return (
    <div style={{ overflow: 'auto', height: '100%', padding: '28px 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-.5px' }}>Dashboard</h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 3 }}>Ringkasan keuangan tim — {periodLabel(period)}</p>
        </div>
        <Button Icon={Plus} onClick={() => navigate('/expenses/new')}>Tambah Pengeluaran</Button>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <StatCard label="Total Pengeluaran" value={fmt(total)} sub={`${monthExpenses.length} transaksi`} Icon={Coins} color="#2563EB" />
          <StatCard label="Sudah Lunas" value={fmt(lunas)} sub={`${monthExpenses.filter(e => e.is_settled).length} item`} Icon={CheckCircle} color="#16A34A" />
          <StatCard label="Belum Lunas" value={fmt(belum)} sub={`${monthExpenses.filter(e => !e.is_settled).length} item menunggu`} Icon={Clock} color="#DC2626" />
          <StatCard label="Rata-rata/Orang" value={fmt(avgPerMember)} sub="bulan ini" Icon={User} color="#D97706" />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Bar chart */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '22px 24px', boxShadow: '0 1px 3px rgba(15,23,42,0.06)', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Pengeluaran per Kategori</div>
            <Badge color="grey">{periodLabel(period)}</Badge>
          </div>
          {catDataFixed.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#94A3B8', fontSize: 13 }}>Belum ada data</div>
          ) : (
            <BarChart data={catDataFixed} />
          )}
        </div>

        {/* Member contribution */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '22px 24px', boxShadow: '0 1px 3px rgba(15,23,42,0.06)', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 18 }}>Kontribusi Anggota</div>
          {memberStats.map((s, i) => (
            <div key={s.member.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <Avatar name={s.member.name} size={34} index={i} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{s.member.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: s.diff >= 0 ? '#16A34A' : '#DC2626' }}>
                    {s.diff >= 0 ? '+' : ''}{fmtK(Math.round(s.diff))}
                  </span>
                </div>
                <div style={{ height: 5, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(s.paid / maxPaid) * 100}%`, background: '#2563EB', borderRadius: 99, transition: 'width 600ms' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent transactions */}
      <div style={{ background: '#fff', borderRadius: 16, padding: '22px 24px', boxShadow: '0 1px 3px rgba(15,23,42,0.06)', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Transaksi Terbaru</div>
          <Button variant="ghost" size="sm" iconRight={ArrowRight} onClick={() => navigate('/expenses')}>Lihat semua</Button>
        </div>
        {recent.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#94A3B8', fontSize: 13 }}>Belum ada transaksi bulan ini</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {recent.map((e, idx) => {
              const payer = members.find(m => m.id === e.paid_by)
              const color = (CATEGORY_COLORS as Record<string, string>)[e.category] ?? '#64748B'
              return (
                <div key={e.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 0',
                  borderBottom: idx < recent.length - 1 ? '1px solid #F1F5F9' : 'none',
                }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Coins size={15} color={color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.description}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                      {fmtDate(e.date)} · Dibayar <strong style={{ color: '#64748B' }}>{payer?.name ?? '?'}</strong>
                    </div>
                  </div>
                  <Badge color="grey">{e.category}</Badge>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{fmt(e.amount)}</div>
                    <Badge color={e.is_settled ? 'green' : 'red'} dot>{e.is_settled ? 'Lunas' : 'Belum'}</Badge>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, Icon, color }: {
  label: string; value: string; sub: string
  Icon: React.ComponentType<{ size: number; color: string }>; color: string
}) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: '20px 22px', boxShadow: '0 1px 3px rgba(15,23,42,0.06)', border: '1px solid #E2E8F0', flex: 1, minWidth: 160 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</div>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={color} />
        </div>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', letterSpacing: '-.5px', marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: '#94A3B8' }}>{sub}</div>
    </div>
  )
}

function BarChart({ data }: { data: { label: string; val: number; color: string }[] }) {
  const max = Math.max(...data.map(d => d.val))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {data.map(d => (
        <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 100, fontSize: 12, color: '#64748B', fontWeight: 500, flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.label}</div>
          <div style={{ flex: 1, height: 28, background: '#F8FAFC', borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
            <div style={{
              height: '100%', width: `${(d.val / max) * 100}%`,
              background: d.color, borderRadius: 6,
              transition: 'width 800ms cubic-bezier(.4,0,.2,1)',
              display: 'flex', alignItems: 'center', paddingLeft: 10,
            }}>
              {(d.val / max) > 0.25 && <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{fmtK(d.val)}</span>}
            </div>
            {(d.val / max) <= 0.25 && (
              <span style={{ position: 'absolute', left: `${(d.val / max) * 100 + 2}%`, top: '50%', transform: 'translateY(-50%)', fontSize: 11, fontWeight: 700, color: '#334155' }}>
                {fmtK(d.val)}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
