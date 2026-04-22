import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { Modal } from '../components/ui/Modal'
import { SkeletonTable } from '../components/ui/Skeleton'
import { useTeam } from '../context/TeamContext'
import { useExpenses } from '../hooks/useExpenses'
import { useApp } from '../context/AppContext'
import { fmt, fmtDateShort } from '../lib/utils'
import { CATEGORIES } from '../types/database'

const PER_PAGE = 10

export function ExpensesPage() {
  const navigate = useNavigate()
  const { team, members } = useTeam()
  const { expenses, loading, reload, deleteExpense, toggleSettled } = useExpenses(team?.id)
  const { showToast } = useApp()

  const [q, setQ]                   = useState('')
  const [catFilter, setCatFilter]   = useState('Semua')
  const [statusFilter, setStatus]   = useState('Semua')
  const [page, setPage]             = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const filtered = expenses.filter(e => {
    const payer = members.find(m => m.id === e.paid_by)
    const mq = !q || e.description.toLowerCase().includes(q.toLowerCase()) || payer?.name.toLowerCase().includes(q.toLowerCase())
    const mc = catFilter === 'Semua' || e.category === catFilter
    const ms = statusFilter === 'Semua' || (statusFilter === 'Lunas' && e.is_settled) || (statusFilter === 'Belum' && !e.is_settled)
    return mq && mc && ms
  })

  const pages = Math.ceil(filtered.length / PER_PAGE)
  const rows  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const handleDelete = async () => {
    if (!deleteTarget) return
    const ok = await deleteExpense(deleteTarget)
    setDeleteTarget(null)
    if (ok) showToast('Pengeluaran dihapus', 'success')
    else showToast('Gagal menghapus', 'error')
  }

  const handleToggle = async (id: string) => {
    const ok = await toggleSettled(id)
    if (ok) showToast('Status diperbarui', 'success')
  }

  const resetFilters = () => { setQ(''); setCatFilter('Semua'); setStatus('Semua'); setPage(1) }

  return (
    <div style={{ overflow: 'auto', height: '100%', padding: '28px 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-.5px' }}>Daftar Pengeluaran</h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 3 }}>{expenses.length} total transaksi tim</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" size="sm" icon="refresh" onClick={reload}>Refresh</Button>
          <Button icon="plus" onClick={() => navigate('/expenses/new')}>Tambah Baru</Button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 320 }}>
          <i className="fi fi-rr-search" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#94A3B8', pointerEvents: 'none', lineHeight: 1, display: 'inline-flex', alignItems: 'center' }} />
          <input value={q} onChange={e => { setQ(e.target.value); setPage(1) }}
            placeholder="Cari pengeluaran…"
            style={{ width: '100%', height: 38, borderRadius: 8, border: '1px solid #CBD5E1', background: '#fff', paddingLeft: 34, paddingRight: 12, fontSize: 13, color: '#0F172A', fontFamily: 'inherit', outline: 'none' }} />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['Semua', ...CATEGORIES].map(c => (
            <button key={c} onClick={() => { setCatFilter(c); setPage(1) }}
              style={{ padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: `1px solid ${catFilter === c ? '#2563EB' : '#E2E8F0'}`, background: catFilter === c ? '#EFF6FF' : '#fff', color: catFilter === c ? '#2563EB' : '#64748B', transition: 'all 150ms', fontFamily: 'inherit' }}>
              {c}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
          {(['Semua', 'Lunas', 'Belum'] as const).map(s => (
            <button key={s} onClick={() => { setStatus(s); setPage(1) }}
              style={{ padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms', border: `1px solid ${statusFilter === s ? (s === 'Lunas' ? '#16A34A' : s === 'Belum' ? '#DC2626' : '#2563EB') : '#E2E8F0'}`, background: statusFilter === s ? (s === 'Lunas' ? '#F0FDF4' : s === 'Belum' ? '#FEF2F2' : '#EFF6FF') : '#fff', color: statusFilter === s ? (s === 'Lunas' ? '#16A34A' : s === 'Belum' ? '#DC2626' : '#2563EB') : '#64748B' }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? <SkeletonTable /> : rows.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', padding: '64px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fi fi-rr-receipt" style={{ fontSize: 28, color: '#2563EB', lineHeight: 1, display: 'inline-flex', alignItems: 'center' }} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>Tidak ada pengeluaran</div>
          <div style={{ fontSize: 13, color: '#64748B', maxWidth: 300 }}>
            {q || catFilter !== 'Semua' || statusFilter !== 'Semua'
              ? 'Coba ubah filter pencarian.'
              : 'Tambahkan pengeluaran pertama tim kamu.'}
          </div>
          {q || catFilter !== 'Semua' || statusFilter !== 'Semua'
            ? <Button variant="secondary" size="sm" onClick={resetFilters}>Reset Filter</Button>
            : <Button icon="plus" size="sm" onClick={() => navigate('/expenses/new')}>Tambah Pengeluaran</Button>}
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}>
          {/* Table head */}
          <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 130px 110px 110px 100px 110px', gap: 8, padding: '10px 16px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
            {['Tanggal', 'Deskripsi', 'Kategori', 'Nominal', 'Dibayar Oleh', 'Status', 'Aksi'].map(h => (
              <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</div>
            ))}
          </div>

          {rows.map(e => {
            const payer = members.find(m => m.id === e.paid_by)
            const payerIdx = members.findIndex(m => m.id === e.paid_by)
            return (
              <div key={e.id}
                style={{ display: 'grid', gridTemplateColumns: '90px 1fr 130px 110px 110px 100px 110px', gap: 8, padding: '12px 16px', borderBottom: '1px solid #F1F5F9', alignItems: 'center', transition: 'background 150ms' }}
                onMouseEnter={ev => ev.currentTarget.style.background = '#F8FAFC'}
                onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}
              >
                <div style={{ fontSize: 12, color: '#64748B' }}>{fmtDateShort(e.date)}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.description}</div>
                  {e.notes && <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>{e.notes}</div>}
                </div>
                <div><Badge color="grey">{e.category}</Badge></div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{fmt(e.amount)}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  {payer && <Avatar name={payer.name} size={20} index={payerIdx} />}
                  <span style={{ fontSize: 12, color: '#334155' }}>{payer?.name ?? '?'}</span>
                </div>
                <div>
                  <button onClick={() => handleToggle(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <Badge color={e.is_settled ? 'green' : 'red'} dot>{e.is_settled ? 'Lunas' : 'Belum'}</Badge>
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Button size="sm" variant="secondary" icon="pencil" onClick={() => navigate(`/expenses/${e.id}/edit`)} />
                  <Button size="sm" variant="danger" icon="trash" onClick={() => setDeleteTarget(e.id)} />
                </div>
              </div>
            )
          })}

          {/* Pagination */}
          {pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: 12, color: '#64748B' }}>
                Menampilkan {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} dari {filtered.length}
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                <Button size="sm" variant="secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</Button>
                {Array.from({ length: pages }, (_, i) => i + 1).map(i => (
                  <button key={i} onClick={() => setPage(i)}
                    style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${i === page ? '#2563EB' : '#E2E8F0'}`, background: i === page ? '#2563EB' : '#fff', color: i === page ? '#fff' : '#334155', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {i}
                  </button>
                ))}
                <Button size="sm" variant="secondary" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}>›</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {deleteTarget && (
        <Modal
          title="Hapus Pengeluaran?"
          description="Aksi ini tidak bisa dibatalkan. Pengeluaran akan dihapus secara permanen."
          confirmLabel="Hapus"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
