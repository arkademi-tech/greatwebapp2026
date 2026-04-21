import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/ui/Button';

export function OnboardPage() {
  const { user, signOut } = useApp();
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [name, setName]         = useState('');
  const [teamName, setTeamName] = useState('');
  const [token, setToken]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleCreate = async () => {
    if (!name.trim() || !teamName.trim()) { setError('Semua field wajib diisi'); return; }
    setLoading(true); setError('');
    const { data: teamData, error: te } = await supabase
      .from('teams').insert({ name: teamName.trim() }).select().single();
    if (te || !teamData) { setError('Gagal membuat tim'); setLoading(false); return; }
    const { error: me } = await supabase.from('members').insert({
      team_id: teamData.id, name: name.trim(), user_id: user?.id,
    });
    if (me) { setError('Gagal membuat profil anggota'); setLoading(false); return; }
    // trigger reload
    window.location.reload();
  };

  const handleJoin = async () => {
    if (!name.trim() || !token.trim()) { setError('Semua field wajib diisi'); return; }
    setLoading(true); setError('');
    const { data: teamData, error: te } = await supabase
      .from('teams').select('*').eq('share_token', token.trim()).single();
    if (te || !teamData) { setError('Token tim tidak ditemukan'); setLoading(false); return; }
    const { error: me } = await supabase.from('members').insert({
      team_id: teamData.id, name: name.trim(), user_id: user?.id,
    });
    if (me) { setError('Gagal bergabung dengan tim'); setLoading(false); return; }
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: '#F1F5F9', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4">
            <i className="fi fi-rr-coins flex items-center text-white text-2xl" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Selamat datang!</h1>
          <p className="text-sm text-slate-500 mt-1">Buat tim baru atau bergabung dengan tim yang sudah ada</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm">
          <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
            {(['create', 'join'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); }}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer"
                style={{ background: mode === m ? '#fff' : 'transparent', color: mode === m ? '#0F172A' : '#94A3B8' }}>
                {m === 'create' ? 'Buat Tim Baru' : 'Gabung Tim'}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>
          )}

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Nama Kamu</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="mis. Andi"
                className="w-full h-11 rounded-xl border border-slate-300 px-4 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            {mode === 'create' ? (
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Nama Tim</label>
                <input value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="mis. Tim Freelance Kita"
                  className="w-full h-11 rounded-xl border border-slate-300 px-4 text-sm focus:outline-none focus:border-blue-500" />
              </div>
            ) : (
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Token Tim</label>
                <input value={token} onChange={e => setToken(e.target.value)} placeholder="Masukkan share token tim"
                  className="w-full h-11 rounded-xl border border-slate-300 px-4 text-sm focus:outline-none focus:border-blue-500" />
              </div>
            )}
            <Button full size="lg" onClick={mode === 'create' ? handleCreate : handleJoin} disabled={loading}>
              {loading ? 'Memproses…' : mode === 'create' ? 'Buat Tim' : 'Gabung Tim'}
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          Login sebagai {user?.email} ·{' '}
          <button onClick={signOut} className="text-blue-600 font-semibold cursor-pointer bg-none border-none">Keluar</button>
        </p>
      </div>
    </div>
  );
}
