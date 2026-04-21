import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';

type Mode = 'login' | 'register';

interface FormErr { email?: string; password?: string; name?: string; teamName?: string; general?: string; }

export function AuthPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [teamName, setTeamName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState<FormErr>({});

  const validate = (): boolean => {
    const e: FormErr = {};
    if (!email.match(/^[^@]+@[^@]+\.[^@]+$/)) e.email = 'Format email tidak valid';
    if (password.length < 6) e.password = 'Password minimal 6 karakter';
    if (mode === 'register') {
      if (!name.trim()) e.name = 'Nama wajib diisi';
      if (!teamName.trim()) e.teamName = 'Nama tim wajib diisi';
    }
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setErrors({ general: error.message });
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // 1. Create auth user
      const { data: authData, error: authErr } = await supabase.auth.signUp({ email, password });
      if (authErr || !authData.user) {
        setErrors({ general: authErr?.message ?? 'Registrasi gagal' });
        return;
      }

      // 2. Create team
      const { data: teamData, error: teamErr } = await supabase
        .from('teams').insert({ name: teamName }).select().single();
      if (teamErr || !teamData) {
        setErrors({ general: 'Gagal membuat tim. Coba lagi.' });
        return;
      }

      // 3. Create member linked to this user
      const { error: memErr } = await supabase.from('members').insert({
        team_id: teamData.id,
        name: name.trim(),
        user_id: authData.user.id,
      });
      if (memErr) {
        setErrors({ general: 'Gagal membuat profil anggota. Coba lagi.' });
      }
      // auth state change will handle the redirect
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (hasErr: boolean) =>
    `w-full h-11 rounded-xl border px-4 text-sm text-slate-900 bg-white focus:outline-none transition-colors ${hasErr ? 'border-red-400 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'}`;

  return (
    <div className="min-h-screen flex" style={{ background: '#F1F5F9', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-96 shrink-0 p-10 text-white" style={{ background: '#0F172A' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
            <i className="fi fi-rr-coins flex items-center text-white" />
          </div>
          <div>
            <div className="font-bold text-base">SplitMate</div>
            <div className="text-xs text-slate-400">Kelola bersama</div>
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-extrabold leading-tight mb-4">
            Catat pengeluaran<br/>tim dengan mudah
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            Transparansi keuangan untuk tim freelance kecil. Siapa bayar apa, siapa hutang siapa — semua tercatat rapi.
          </p>
          <div className="flex flex-col gap-3">
            {[
              { icon: 'check-circle', text: 'Split tagihan otomatis' },
              { icon: 'chart-pie',    text: 'Rekap hutang per anggota' },
              { icon: 'coins',        text: 'Settlement yang simpel' },
            ].map(f => (
              <div key={f.icon} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center shrink-0">
                  <i className={`fi fi-rr-${f.icon} flex items-center text-blue-400 text-sm`} />
                </div>
                <span className="text-sm text-slate-300">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-600">© 2025 SplitMate · Arkademi</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            {/* Toggle */}
            <div className="flex bg-slate-100 rounded-xl p-1 mb-7">
              {(['login', 'register'] as Mode[]).map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setErrors({}); }}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer"
                  style={{
                    background: mode === m ? '#fff' : 'transparent',
                    color: mode === m ? '#0F172A' : '#94A3B8',
                    boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
                  }}
                >
                  {m === 'login' ? 'Masuk' : 'Daftar'}
                </button>
              ))}
            </div>

            <h1 className="text-xl font-bold text-slate-900 mb-1">
              {mode === 'login' ? 'Selamat datang kembali!' : 'Buat akun baru'}
            </h1>
            <p className="text-sm text-slate-500 mb-6">
              {mode === 'login' ? 'Masuk ke akun SplitMate kamu' : 'Daftar dan mulai kelola pengeluaran tim'}
            </p>

            {errors.general && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600 font-medium">
                {errors.general}
              </div>
            )}

            <div className="flex flex-col gap-4">
              {mode === 'register' && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">Nama Kamu <span className="text-red-500">*</span></label>
                    <input value={name} onChange={e => setName(e.target.value)}
                      placeholder="mis. Andi" className={inputClass(!!errors.name)} />
                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">Nama Tim <span className="text-red-500">*</span></label>
                    <input value={teamName} onChange={e => setTeamName(e.target.value)}
                      placeholder="mis. Tim Freelance Kita" className={inputClass(!!errors.teamName)} />
                    {errors.teamName && <p className="text-xs text-red-500 mt-1">{errors.teamName}</p>}
                  </div>
                </>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Email <span className="text-red-500">*</span></label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="email@contoh.com" className={inputClass(!!errors.email)} />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 6 karakter"
                    className={`${inputClass(!!errors.password)} pr-12`}
                    onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleRegister())}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer bg-none border-none"
                  >
                    <i className={`fi fi-rr-${showPass ? 'eye-crossed' : 'eye'} flex items-center text-base`} />
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
              </div>

              <Button
                full
                size="lg"
                onClick={mode === 'login' ? handleLogin : handleRegister}
                disabled={loading}
              >
                {loading
                  ? (mode === 'login' ? 'Masuk…' : 'Mendaftar…')
                  : (mode === 'login' ? 'Masuk' : 'Buat Akun & Tim')
                }
              </Button>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-4">
            {mode === 'login' ? 'Belum punya akun? ' : 'Sudah punya akun? '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErrors({}); }}
              className="text-blue-600 font-semibold cursor-pointer bg-none border-none"
            >
              {mode === 'login' ? 'Daftar sekarang' : 'Masuk'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
