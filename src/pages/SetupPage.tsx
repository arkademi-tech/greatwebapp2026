import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, X, Users, Link } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { useTeam } from '../context/TeamContext'
import { useApp } from '../context/AppContext'

type Mode = 'choice' | 'create' | 'join'

export function SetupPage() {
  const [mode, setMode]         = useState<Mode>('choice')
  const [teamName, setTeamName] = useState('')
  const [myName, setMyName]     = useState('')
  const [joinToken, setJoinToken] = useState('')
  const [members, setMembers]   = useState(['', ''])
  const { createTeam, joinByToken, loading, error } = useTeam()
  const { showToast } = useApp()
  const navigate = useNavigate()
  const { token } = useParams<{ token?: string }>()

  useEffect(() => {
    if (token) { setJoinToken(token); setMode('join') }
  }, [token])

  const addMember = () => setMembers(p => [...p, ''])
  const removeMember = (i: number) => setMembers(p => p.filter((_, idx) => idx !== i))
  const setMember = (i: number, v: string) => setMembers(p => p.map((m, idx) => idx === i ? v : m))

  const handleCreate = async () => {
    const names = members.map(m => m.trim()).filter(Boolean)
    if (!teamName.trim()) return showToast('Nama tim wajib diisi', 'error')
    if (!myName.trim())   return showToast('Nama kamu wajib diisi', 'error')
    if (names.length < 2) return showToast('Minimal 2 anggota tim', 'error')
    if (!names.includes(myName.trim())) names.push(myName.trim())

    const ok = await createTeam(teamName.trim(), names, myName.trim())
    if (ok) { showToast('Tim berhasil dibuat!', 'success'); navigate('/') }
    else showToast(error ?? 'Gagal membuat tim', 'error')
  }

  const handleJoin = async () => {
    if (!joinToken.trim()) return showToast('Masukkan token tim', 'error')
    if (!myName.trim())    return showToast('Nama kamu wajib diisi', 'error')
    const ok = await joinByToken(joinToken.trim(), myName.trim())
    if (ok) { showToast('Berhasil bergabung!', 'success'); navigate('/') }
    else showToast(error ?? 'Token tidak valid', 'error')
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#F1F5F9',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <span style={{ fontSize: 28, color: '#fff', fontWeight: 900 }}>S</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', letterSpacing: '-.5px' }}>SplitMate</h1>
          <p style={{ fontSize: 14, color: '#64748B', marginTop: 4 }}>Pencatat pengeluaran bersama untuk tim freelance</p>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: 28, boxShadow: '0 4px 12px rgba(15,23,42,0.08)', border: '1px solid #E2E8F0' }}>
          {mode === 'choice' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>Mulai</h2>
              <button onClick={() => setMode('create')} style={{
                padding: '16px', borderRadius: 12, border: '1px solid #E2E8F0',
                background: '#fff', cursor: 'pointer', textAlign: 'left', transition: 'all 150ms',
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#2563EB')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={20} color="#2563EB" />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Buat Tim Baru</div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Mulai dari awal, undang anggota tim kamu</div>
                  </div>
                </div>
              </button>
              <button onClick={() => setMode('join')} style={{
                padding: '16px', borderRadius: 12, border: '1px solid #E2E8F0',
                background: '#fff', cursor: 'pointer', textAlign: 'left', transition: 'all 150ms',
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#2563EB')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Link size={20} color="#16A34A" />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Gabung ke Tim</div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Punya link/token dari teman tim kamu</div>
                  </div>
                </div>
              </button>
            </div>
          )}

          {mode === 'create' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <button onClick={() => setMode('choice')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>←</button>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>Buat Tim Baru</h2>
              </div>
              <Field label="Nama Tim *" value={teamName} onChange={setTeamName} placeholder="mis. Studio Kreatif Kami" />
              <Field label="Nama Kamu *" value={myName} onChange={setMyName} placeholder="Masukkan namamu" />
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 8 }}>Anggota Tim *</label>
                {members.map((m, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input value={m} onChange={e => setMember(i, e.target.value)}
                      placeholder={`Anggota ${i + 1}`}
                      style={{ flex: 1, height: 40, borderRadius: 8, border: '1.5px solid #CBD5E1', padding: '0 12px', fontSize: 13, color: '#0F172A', fontFamily: 'inherit' }} />
                    {members.length > 2 && (
                      <button onClick={() => removeMember(i)} style={{ background: '#FEF2F2', border: 'none', borderRadius: 8, width: 40, cursor: 'pointer', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
                {members.length < 8 && (
                  <button onClick={addMember} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#2563EB', fontSize: 13, fontWeight: 500, padding: '4px 0' }}>
                    <Plus size={14} /> Tambah anggota
                  </button>
                )}
              </div>
              <Button full type="button" onClick={handleCreate} disabled={loading}>
                {loading ? 'Membuat tim…' : 'Buat Tim'}
              </Button>
            </div>
          )}

          {mode === 'join' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <button onClick={() => setMode('choice')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>←</button>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>Gabung ke Tim</h2>
              </div>
              <Field label="Token / Share Link Tim *" value={joinToken} onChange={setJoinToken} placeholder="Paste token atau link tim" />
              <Field label="Nama Kamu *" value={myName} onChange={setMyName} placeholder="Masukkan namamu" />
              <Button full type="button" onClick={handleJoin} disabled={loading}>
                {loading ? 'Menggabungkan…' : 'Gabung Tim'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', height: 40, borderRadius: 8, border: '1.5px solid #CBD5E1', padding: '0 12px', fontSize: 13, color: '#0F172A', fontFamily: 'inherit', outline: 'none' }} />
    </div>
  )
}
