import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Avatar } from '../components/ui/Avatar'
import { useTeam } from '../context/TeamContext'
import { useExpenses } from '../hooks/useExpenses'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'
import { CATEGORIES, type Category } from '../types/database'
import { fmt } from '../lib/utils'

type FormData = {
  date: string
  description: string
  category: Category | ''
  amount: string
  paid_by: string
  split_among: string[]
  notes: string
  attachment_url: string
}

type Errors = Partial<Record<keyof FormData, string>>

const BLANK: FormData = {
  date: '', description: '', category: '', amount: '',
  paid_by: '', split_among: [], notes: '', attachment_url: '',
}

export function ExpenseFormPage() {
  const navigate = useNavigate()
  const { id }   = useParams<{ id?: string }>()
  const isEdit   = !!id

  const { team, members } = useTeam()
  const { expenses, addExpense, updateExpense } = useExpenses(team?.id)
  const { showToast } = useApp()

  const [form, setForm]       = useState<FormData>(BLANK)
  const [errors, setErrors]   = useState<Errors>({})
  const [saving, setSaving]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEdit && id) {
      const exp = expenses.find(e => e.id === id)
      if (exp) {
        setForm({
          date: exp.date,
          description: exp.description,
          category: exp.category,
          amount: String(exp.amount),
          paid_by: exp.paid_by,
          split_among: exp.split_among,
          notes: exp.notes ?? '',
          attachment_url: exp.attachment_url ?? '',
        })
      }
    }
  }, [id, expenses, isEdit])

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) =>
    setForm(p => ({ ...p, [k]: v }))

  const validate = (): boolean => {
    const e: Errors = {}
    if (!form.date)          e.date = 'Tanggal wajib diisi'
    else if (form.date > new Date().toISOString().slice(0, 10)) e.date = 'Tanggal tidak boleh masa depan'
    if (!form.description.trim()) e.description = 'Deskripsi wajib diisi'
    else if (form.description.trim().length < 3) e.description = 'Minimal 3 karakter'
    if (!form.category)      e.category = 'Pilih kategori'
    const amt = Number(form.amount.replace(/\./g, ''))
    if (!form.amount || isNaN(amt) || amt < 100) e.amount = 'Nominal harus lebih dari Rp 100'
    if (!form.paid_by)       e.paid_by = 'Pilih siapa yang membayar'
    if (!form.split_among.length) e.split_among = 'Pilih minimal 1 anggota'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleUpload = async (file: File) => {
    if (!team) return
    setUploading(true)
    const ext  = file.name.split('.').pop()
    const path = `${team.id}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('attachments').upload(path, file)
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('attachments').getPublicUrl(path)
      set('attachment_url', publicUrl)
      showToast('Lampiran berhasil diupload', 'success')
    } else {
      showToast('Gagal upload lampiran', 'error')
    }
    setUploading(false)
  }

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!validate() || !team) return
    setSaving(true)

    const amount = Number(form.amount.replace(/\./g, ''))
    const payload = {
      team_id: team.id,
      date: form.date,
      description: form.description.trim(),
      category: form.category as Category,
      amount,
      paid_by: form.paid_by,
      split_among: form.split_among,
      notes: form.notes.trim() || null,
      attachment_url: form.attachment_url || null,
      is_settled: false,
    }

    let ok: boolean
    if (isEdit && id) {
      ok = await updateExpense(id, payload)
    } else {
      const row = await addExpense(payload)
      ok = !!row
    }

    setSaving(false)
    if (ok) {
      showToast(isEdit ? 'Pengeluaran diperbarui' : 'Pengeluaran berhasil ditambahkan', 'success')
      navigate('/expenses')
    } else {
      showToast('Gagal menyimpan', 'error')
    }
  }

  const toggleSplit = (memberId: string) => {
    set('split_among', form.split_among.includes(memberId)
      ? form.split_among.filter(x => x !== memberId)
      : [...form.split_among, memberId]
    )
  }

  const amountNum = Number(form.amount.replace(/\./g, ''))
  const perPerson = form.split_among.length > 0 && amountNum >= 100
    ? Math.round(amountNum / form.split_among.length)
    : 0

  return (
    <div style={{ overflow: 'auto', height: '100%', padding: '28px 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-.5px' }}>
            {isEdit ? 'Edit Pengeluaran' : 'Tambah Pengeluaran Baru'}
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 3 }}>Isi detail pengeluaran tim</p>
        </div>
        <Button variant="secondary" icon="arrow-left" onClick={() => navigate('/expenses')}>Kembali</Button>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 740 }}>

          {/* Date */}
          <Field label="Tanggal *" error={errors.date}>
            <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              style={inputStyle(!!errors.date)} />
          </Field>

          {/* Description */}
          <Field label="Deskripsi *" error={errors.description}>
            <input value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="mis. Makan siang diskusi project…"
              maxLength={100}
              style={inputStyle(!!errors.description)} />
          </Field>

          {/* Category */}
          <Field label="Kategori *" error={errors.category}>
            <select value={form.category} onChange={e => set('category', e.target.value as Category)}
              style={{ ...inputStyle(!!errors.category), color: form.category ? '#0F172A' : '#94A3B8' }}>
              <option value="">Pilih kategori…</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>

          {/* Amount */}
          <Field label="Nominal (Rp) *" error={errors.amount}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#64748B', pointerEvents: 'none' }}>Rp</span>
              <input
                value={form.amount}
                onChange={e => {
                  const raw = e.target.value.replace(/\./g, '').replace(/\D/g, '')
                  const formatted = raw.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
                  set('amount', formatted)
                }}
                placeholder="0"
                style={{ ...inputStyle(!!errors.amount), paddingLeft: 36 }}
              />
            </div>
          </Field>

          {/* Paid by */}
          <Field label="Dibayar Oleh *" error={errors.paid_by}>
            <select value={form.paid_by} onChange={e => set('paid_by', e.target.value)}
              style={{ ...inputStyle(!!errors.paid_by), color: form.paid_by ? '#0F172A' : '#94A3B8' }}>
              <option value="">Siapa yang bayar?</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </Field>

          {/* Split among */}
          <Field label="Split Kepada *" error={errors.split_among}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', padding: '10px 12px', border: `1.5px solid ${errors.split_among ? '#DC2626' : '#CBD5E1'}`, borderRadius: 8, background: '#fff' }}>
              {members.map((m, i) => {
                const on = form.split_among.includes(m.id)
                return (
                  <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="checkbox" checked={on} onChange={() => toggleSplit(m.id)}
                      style={{ accentColor: '#2563EB', width: 14, height: 14 }} />
                    <Avatar name={m.name} size={20} index={i} />
                    <span style={{ fontSize: 12, fontWeight: on ? 600 : 400, color: on ? '#2563EB' : '#64748B' }}>{m.name}</span>
                  </label>
                )
              })}
            </div>
            {perPerson > 0 && (
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                = {fmt(perPerson)} / orang
              </div>
            )}
          </Field>

          {/* Notes */}
          <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>
              Catatan <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 400 }}>(opsional)</span>
            </label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Tambahkan catatan…" rows={2} maxLength={300}
              style={{ borderRadius: 8, border: '1.5px solid #CBD5E1', background: '#fff', padding: '10px 12px', fontSize: 13, color: '#0F172A', resize: 'vertical', fontFamily: 'inherit', outline: 'none' }} />
          </div>

          {/* Attachment */}
          <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>
              Lampiran <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 400 }}>(opsional)</span>
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              style={{ border: `1.5px dashed ${form.attachment_url ? '#16A34A' : '#CBD5E1'}`, borderRadius: 12, padding: 20, cursor: 'pointer', textAlign: 'center', background: '#F8FAFC', transition: 'all 150ms' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#2563EB'}
              onMouseLeave={e => e.currentTarget.style.borderColor = form.attachment_url ? '#16A34A' : '#CBD5E1'}
            >
              <i className="fi fi-rr-upload" style={{ fontSize: 20, color: '#94A3B8', display: 'block', margin: '0 auto 6px', lineHeight: 1, textAlign: 'center' }} />
              <div style={{ fontSize: 13, color: '#64748B', fontWeight: 500 }}>
                {uploading ? 'Mengupload…' : form.attachment_url ? '✓ File terupload' : 'Klik untuk upload nota / struk'}
              </div>
              <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 3 }}>PDF, JPG, PNG — maks. 2 MB</div>
              <input ref={fileRef} type="file" style={{ display: 'none' }} accept=".pdf,.jpg,.jpeg,.png"
                onChange={e => { const f = e.target.files?.[0]; if (f && f.size <= 2 * 1024 * 1024) handleUpload(f) }} />
            </div>
          </div>

          {/* Actions */}
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid #E2E8F0' }}>
            <Button variant="secondary" type="button" onClick={() => navigate('/expenses')}>Batal</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Menyimpan…' : isEdit ? 'Simpan Perubahan' : 'Tambah Pengeluaran'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{label}</label>
      {children}
      {error && <span style={{ fontSize: 11, color: '#DC2626' }}>{error}</span>}
    </div>
  )
}

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    width: '100%', height: 40, borderRadius: 8,
    border: `1.5px solid ${hasError ? '#DC2626' : '#CBD5E1'}`,
    background: '#fff', padding: '0 12px', fontSize: 13,
    color: '#0F172A', fontFamily: 'inherit', outline: 'none',
    transition: 'border 150ms',
  }
}
