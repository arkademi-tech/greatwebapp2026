import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/ui/Button';

export function OnboardPage() {
  const { user, signOut } = useApp();
  const [mode, setMode]         = useState<'create' | 'join'>('create');
  const [name, setName]         = useState('');
  const [teamName, setTeamName] = useState('');
  const [token, setToken]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const inputCls = 'w-full h-11 rounded-xl border border-slate-300 px-4 text-sm text-slate-900 focus:outline-none focus:border-blue-500 transition-colors';

  const handleCreate = async () => {
    if (!name.trim() || !teamName.trim()) { setError('Semua field wajib diisi'); return; }
    setLoading(true); setError('');
    try {
      const { data: teamData, error: te } = await supabase
        .from('teams').insert({ name: teamName.trim() }).select().single();
      if (te || !teamData) { setError(`Gagal membuat tim: ${te?.message}`); return; }
      const { error: me } = await supabase.from('members').insert({
        team_id: teamData.id, name: name.trim(), user_id: user?.id,
      });
      if (me) { setError(`Gagal membuat profil: ${me.message}`); return; }
      window.location.reload();
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!name.trim() || !token.trim()) { setError('Semua field wajib diisi'); return; }
    setLoading(true); setError('');
    try {
      const { data: teamData, error: te } = await supabase
        .from('teams').select('id, name').eq('share_token', token.trim()).maybeSingle();
      if (te) { setError(`Error: ${te.message}`); return; }
      if (!teamData) { setError('Token tidak valid atau tim tidak ditemukan'); return; }
      const { error: me } = await supabase.from('members').insert({
        team_id: teamData.id, name: name.trim(), user_id: user?.id,
      });
      if (me) { setError(`Gagal bergabung: ${me.message}`); return; }
      window.location.reload();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: '#F1F5F9', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4">
            <i className="fi fi-rr-coins flex items-center text-white text-2xl" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Satu langkah lagi!</h1>
          <p className="text-sm text-slate-500 mt-1">Buat tim baru atau bergabung dengan tim yang sudah ada</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm">
          <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
            {(['create', 'join'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); }}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer border-none"
                style={{ background: mode === m ? '#fff' : 'transparent', color: mode === m ? '#0F172A' : '#94A3B8', boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,.08)' : 'none' }}>
                {m === 'create' ? 'Buat Tim Baru' : 'Gabung Tim'}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>
          )}

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Nama Kamu *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="mis. Andi"
                className={inputCls} />
            </div>

            {mode === 'create' ? (
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Nama Tim *</label>
                <input value={teamName} onChange={e => setTeamName(e.target.value)}
                  placeholder="mis. Tim Freelance Kita" className={inputCls} />
              </div>
            ) : (
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Token Tim *</label>
                <input value={token} onChange={e => setToken(e.target.value)}
                  placeholder="Minta token dari admin tim" className={inputCls} />
                <p className="text-xs text-slate-400 mt-1">Token tersedia di halaman Rekap & Hutang, bagian info tim.</p>
              </div>
            )}

            <Button full size="lg" onClick={mode === 'create' ? handleCreate : handleJoin} disabled={loading}>
              {loading ? 'Memproses…' : mode === 'create' ? 'Buat Tim & Mulai' : 'Gabung Tim'}
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          Login sebagai <strong className="text-slate-600">{user?.email}</strong> ·{' '}
          <button onClick={signOut} className="text-blue-600 font-semibold cursor-pointer bg-transparent border-none">Keluar</button>
        </p>
      </div>
    </div>
  );
}
