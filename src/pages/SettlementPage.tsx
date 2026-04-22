import { useState, useMemo } from 'react'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { Modal } from '../components/ui/Modal'
import { useTeam } from '../context/TeamContext'
import { useExpenses } from '../hooks/useExpenses'
import { useSettlements } from '../hooks/useSettlement'
import { useApp } from '../context/AppContext'
import { fmt, calculateSettlements, currentPeriod, periodLabel } from '../lib/utils'
import { CATEGORY_COLORS } from '../types/database'

export function SettlementPage() {
  const { team, members } = useTeam()
  const { expenses, toggleSettled } = useExpenses(team?.id)
  useSettlements(team?.id)
  const { showToast } = useApp()
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [localPaid, setLocalPaid] = useState<Set<number>>(new Set())

  const period = currentPeriod()

  const unsettled = useMemo(() =>
    expenses.filter(e => !e.is_settled && e.date.startsWith(period.slice(0, 7))),
    [expenses, period]
  )

  const balances = useMemo(() => {
    const b: Record<string, number> = {}
    members.forEach(m => { b[m.id] = 0 })
    unsettled.forEach(e => {
      b[e.paid_by] = (b[e.paid_by] ?? 0) + e.amount
      e.split_among.forEach(mId => {
        b[mId] = (b[mId] ?? 0) - e.amount / e.split_among.length
      })
    })
    return b
  }, [unsettled, members])

  const txs = useMemo(() => calculateSettlements(balances), [balances])

  const totalUnpaid = unsettled.reduce((s, e) => s + e.amount, 0)
  const paidCount   = localPaid.size

  const handleMarkPaid = async () => {
    if (confirmId === null) return
    setLocalPaid(p => new Set([...p, confirmId]))
    setConfirmId(null)
    showToast('Pembayaran ditandai lunas ✓', 'success')
  }

  const handleMarkExpenseLunas = async (id: string) => {
    const ok = await toggleSettled(id)
    if (ok) showToast('Ditandai lunas', 'success')
    else showToast('Gagal memperbarui', 'error')
  }

  const exportCSV = () => {
    const rows = [
      ['Dari', 'Ke', 'Jumlah', 'Status'],
      ...txs.map((t, i) => [
        members.find(m => m.id === t.from)?.name ?? t.from,
        members.find(m => m.id === t.to)?.name ?? t.to,
        t.amount,
        localPaid.has(i) ? 'Lunas' : 'Belum',
      ]),
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `splitmate-${period}.csv`
    a.click()
    showToast('Rekap diexport', 'success')
  }

  return (
    <div style={{ overflow: 'auto', height: '100%', padding: '28px 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-.5px' }}>Rekap & Hutang</h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 3 }}>Siapa yang harus transfer ke siapa — {periodLabel(period)}</p>
        </div>
        <Button variant="secondary" icon="file-export" onClick={exportCSV}>Export CSV</Button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
        <SCard label="Belum Dilunasi" value={fmt(totalUnpaid)} sub={`${unsettled.length} transaksi`} icon="coins" color="#DC2626" />
        <SCard label="Penyelesaian" value={`${txs.length} transfer`} sub="untuk lunas semua hutang" icon="arrows-repeat" color="#2563EB" />
        <SCard label="Sudah Dikonfirmasi" value={`${paidCount}/${txs.length}`} sub="transfer selesai" icon="check-circle" color="#16A34A" />
      </div>

      {/* Balance per member */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', padding: '22px 24px', marginBottom: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 16 }}>Saldo Bersih Anggota</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {members.map((m, i) => {
            const v = Math.round(balances[m.id] ?? 0)
            const isPos = v >= 0
            return (
              <div key={m.id} style={{
                flex: 1, minWidth: 140,
                background: isPos ? '#F0FDF4' : '#FEF2F2',
                borderRadius: 12, padding: 16,
                border: `1px solid ${isPos ? '#DCFCE7' : '#FEE2E2'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Avatar name={m.name} size={32} index={i} />
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{m.name}</div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: isPos ? '#16A34A' : '#DC2626', letterSpacing: '-.5px' }}>
                  {isPos ? '+' : ''}{fmt(Math.abs(v))}
                </div>
                <div style={{ fontSize: 11, color: isPos ? '#166534' : '#991B1B', marginTop: 3, fontWeight: 500 }}>
                  {isPos ? 'Akan menerima' : 'Harus membayar'}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Settlement table */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Rencana Penyelesaian</div>
          <Badge color="blue">{txs.length} transfer</Badge>
        </div>

        {txs.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <i className="fi fi-rr-party-horn" style={{ fontSize: 26, color: '#16A34A', lineHeight: 1, display: 'inline-flex', alignItems: 'center' }} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Semua lunas! 🎉</div>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Tidak ada hutang yang perlu diselesaikan.</div>
          </div>
        ) : (
          txs.map((t, i) => {
            const done = localPaid.has(i)
            const fromMember = members.find(m => m.id === t.from)
            const toMember   = members.find(m => m.id === t.to)
            const fromIdx    = members.findIndex(m => m.id === t.from)
            const toIdx      = members.findIndex(m => m.id === t.to)
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '16px 24px', borderBottom: '1px solid #F1F5F9',
                opacity: done ? 0.6 : 1, transition: 'opacity 300ms',
              }}>
                {/* From */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                  <Avatar name={fromMember?.name ?? '?'} size={36} index={fromIdx} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{fromMember?.name ?? '?'}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>Pengirim</div>
                  </div>
                </div>

                {/* Arrow + amount */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', letterSpacing: '-.5px' }}>{fmt(t.amount)}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 24, height: 1.5, background: '#CBD5E1' }} />
                    <i className="fi fi-rr-arrow-right" style={{ fontSize: 13, color: '#2563EB', lineHeight: 1, display: 'inline-flex', alignItems: 'center' }} />
                    <div style={{ width: 24, height: 1.5, background: '#CBD5E1' }} />
                  </div>
                  <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 500 }}>Transfer via</div>
                </div>

                {/* To */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, justifyContent: 'flex-end' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{toMember?.name ?? '?'}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>Penerima</div>
                  </div>
                  <Avatar name={toMember?.name ?? '?'} size={36} index={toIdx} />
                </div>

                {/* Action */}
                <div style={{ marginLeft: 8 }}>
                  {done ? (
                    <Badge color="green" dot>Lunas</Badge>
                  ) : (
                    <Button variant="success" size="sm" icon="check" onClick={() => setConfirmId(i)}>
                      Tandai Lunas
                    </Button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Detail Transaksi Belum Lunas */}
      {unsettled.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', marginTop: 20, overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #E2E8F0', fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
            Detail Transaksi Belum Lunas
          </div>
          {unsettled.map(e => {
            const payer = members.find(m => m.id === e.paid_by)
            const payerIdx = members.findIndex(m => m.id === e.paid_by)
            const catColor = (CATEGORY_COLORS as Record<string, string>)[e.category] ?? '#64748B'
            const splitNames = e.split_among
              .map(id => members.find(m => m.id === id)?.name ?? id)
              .join(', ')
            return (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 24px', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: catColor + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className="fi fi-rr-receipt" style={{ fontSize: 14, color: catColor, lineHeight: 1, display: 'inline-flex', alignItems: 'center' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.description}</div>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{e.date} · {splitNames}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', flexShrink: 0 }}>{fmt(e.amount)}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  {payer && <Avatar name={payer.name} size={20} index={payerIdx} />}
                  <span style={{ fontSize: 12, color: '#64748B' }}>{payer?.name ?? '?'}</span>
                </div>
                <Button size="sm" variant="success" icon="check" onClick={() => handleMarkExpenseLunas(e.id)}>
                  Lunas
                </Button>
              </div>
            )
          })}
        </div>
      )}

      {confirmId !== null && (
        <Modal
          title="Tandai Pembayaran Lunas?"
          description="Pastikan transfer sudah dilakukan sebelum konfirmasi. Aksi ini tidak bisa dibatalkan."
          confirmLabel="Konfirmasi Lunas"
          variant="primary"
          onConfirm={handleMarkPaid}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  )
}

function SCard({ label, value, sub, icon, color }: {
  label: string; value: string; sub: string
  icon: string; color: string
}) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: '20px 22px', boxShadow: '0 1px 3px rgba(15,23,42,0.06)', border: '1px solid #E2E8F0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</div>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className={`fi fi-rr-${icon}`} style={{ fontSize: 16, color, lineHeight: 1, display: 'inline-flex', alignItems: 'center' }} />
        </div>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-.5px', marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: '#94A3B8' }}>{sub}</div>
    </div>
  )
}
