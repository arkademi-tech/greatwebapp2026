import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { SkeletonCard } from '../components/ui/Skeleton'
import { useTeam } from '../context/TeamContext'
import { useExpenses } from '../hooks/useExpenses'
import { fmt, fmtK, periodLabel, currentPeriod } from '../lib/utils'
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
        <Button icon="plus" onClick={() => navigate('/expenses/new')}>Tambah Pengeluaran</Button>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <StatCard label="Total Pengeluaran" value={fmt(total)} sub={`${monthExpenses.length} transaksi`} icon="coins" color="#2563EB" trend={12} />
          <StatCard label="Sudah Lunas" value={fmt(lunas)} sub={`${monthExpenses.filter(e => e.is_settled).length} item`} icon="check-circle" color="#16A34A" />
          <StatCard label="Belum Lunas" value={fmt(belum)} sub={`${monthExpenses.filter(e => !e.is_settled).length} item menunggu`} icon="clock" color="#DC2626" />
          <StatCard label="Rata-rata/Orang" value={fmt(avgPerMember)} sub="bulan ini" icon="user" color="#D97706" />
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

      {/* World Clock */}
      <WorldClock />

      {/* Weather Widget */}
      <WeatherWidget />
    </div>
  )
}

function StatCard({ label, value, sub, icon, color, trend }: {
  label: string; value: string; sub: string
  icon: string; color: string; trend?: number
}) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: '20px 22px', boxShadow: '0 1px 3px rgba(15,23,42,0.06)', border: '1px solid #E2E8F0', flex: 1, minWidth: 160 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</div>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className={`fi fi-rr-${icon}`} style={{ fontSize: 16, color, lineHeight: 1, display: 'inline-flex', alignItems: 'center' }} />
        </div>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', letterSpacing: '-.5px', marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: '#94A3B8' }}>{sub}</div>
      {trend !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
          <i className={`fi fi-rr-arrow-small-${trend > 0 ? 'up' : 'down'}`} style={{ fontSize: 12, color: trend > 0 ? '#16A34A' : '#DC2626', lineHeight: 1, display: 'inline-flex', alignItems: 'center' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: trend > 0 ? '#16A34A' : '#DC2626' }}>{Math.abs(trend)}% bulan ini</span>
        </div>
      )}
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

// ─── WEATHER WIDGET ───────────────────────────────────────────────────────────
const WEATHER_CITIES = [
  { city: 'Jakarta',   flag: '🇮🇩', lat: -6.2088,  lon: 106.8456, tz: 'Asia/Jakarta'     },
  { city: 'New York',  flag: '🇺🇸', lat: 40.7128,  lon: -74.006,  tz: 'America/New_York' },
  { city: 'London',    flag: '🇬🇧', lat: 51.5074,  lon: -0.1278,  tz: 'Europe/London'    },
  { city: 'Hong Kong', flag: '🇭🇰', lat: 22.3193,  lon: 114.1694, tz: 'Asia/Hong_Kong'   },
]

const WMO: Record<number, { label: string; icon: string }> = {
  0:  { label: 'Cerah',         icon: '☀️' },
  1:  { label: 'Hampir Cerah',  icon: '🌤️' },
  2:  { label: 'Berawan',       icon: '⛅' },
  3:  { label: 'Mendung',       icon: '☁️' },
  45: { label: 'Berkabut',      icon: '🌫️' },
  48: { label: 'Berkabut',      icon: '🌫️' },
  51: { label: 'Gerimis',       icon: '🌦️' },
  53: { label: 'Gerimis',       icon: '🌦️' },
  55: { label: 'Gerimis Lebat', icon: '🌧️' },
  61: { label: 'Hujan',         icon: '🌧️' },
  63: { label: 'Hujan Lebat',   icon: '🌧️' },
  65: { label: 'Hujan Deras',   icon: '🌧️' },
  71: { label: 'Salju',         icon: '🌨️' },
  73: { label: 'Salju Lebat',   icon: '❄️' },
  80: { label: 'Hujan Lokal',   icon: '🌦️' },
  81: { label: 'Hujan Lokal',   icon: '🌧️' },
  95: { label: 'Petir',         icon: '⛈️' },
  99: { label: 'Petir Lebat',   icon: '⛈️' },
}

type WeatherData = {
  temperature_2m: number
  apparent_temperature: number
  weather_code: number
  wind_speed_10m: number
  relative_humidity_2m: number
} | null

function getWmo(code: number) {
  return WMO[code] ?? WMO[Math.floor(code / 10) * 10] ?? { label: '—', icon: '🌡️' }
}

function WeatherSkeleton() {
  return (
    <div style={{ borderRadius: 12, border: '1px solid #E2E8F0', padding: 16, background: '#FAFBFF' }}>
      <div style={{ height: 14, width: '60%', borderRadius: 6, background: 'linear-gradient(90deg,#E2E8F0 25%,#F1F5F9 50%,#E2E8F0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', marginBottom: 10 }} />
      <div style={{ height: 36, width: 50, borderRadius: 6, background: 'linear-gradient(90deg,#E2E8F0 25%,#F1F5F9 50%,#E2E8F0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', marginBottom: 10 }} />
      <div style={{ height: 12, width: '80%', borderRadius: 6, background: 'linear-gradient(90deg,#E2E8F0 25%,#F1F5F9 50%,#E2E8F0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', marginBottom: 8 }} />
      <div style={{ height: 10, width: '70%', borderRadius: 6, background: 'linear-gradient(90deg,#E2E8F0 25%,#F1F5F9 50%,#E2E8F0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
    </div>
  )
}

function WeatherWidget() {
  const [data, setData] = useState<Record<string, WeatherData>>({})
  const [loading, setLoading] = useState(true)
  const [spinning, setSpinning] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchAll = async () => {
    setLoading(true)
    setSpinning(true)
    const results: Record<string, WeatherData> = {}
    await Promise.all(
      WEATHER_CITIES.map(async ({ city, lat, lon, tz }) => {
        try {
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m&timezone=${encodeURIComponent(tz)}&forecast_days=1`
          const res = await fetch(url)
          const json = await res.json()
          results[city] = json.current ?? null
        } catch {
          results[city] = null
        }
      })
    )
    setData(results)
    setLastUpdate(new Date())
    setLoading(false)
    setSpinning(false)
  }

  useEffect(() => { fetchAll() }, [])

  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: '18px 24px', boxShadow: '0 1px 3px rgba(15,23,42,0.06)', border: '1px solid #E2E8F0', marginBottom: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="fi fi-rr-cloud" style={{ fontSize: 15, color: '#2563EB', lineHeight: 1, display: 'inline-flex', alignItems: 'center' }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Cuaca Sekarang</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {lastUpdate && (
            <span style={{ fontSize: 11, color: '#94A3B8' }}>
              Update {lastUpdate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={fetchAll}
            disabled={loading}
            style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, color: '#64748B', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 5, opacity: loading ? 0.6 : 1 }}
          >
            <i className="fi fi-rr-refresh" style={{ fontSize: 11, lineHeight: 1, display: 'inline-flex', alignItems: 'center', animation: spinning ? 'spin 0.8s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
      </div>

      {/* Cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {loading
          ? WEATHER_CITIES.map(c => <WeatherSkeleton key={c.city} />)
          : WEATHER_CITIES.map(({ city, flag }) => {
              const d = data[city]
              const w = d ? getWmo(d.weather_code) : null
              const temp = d ? Math.round(d.temperature_2m) : null
              const feels = d ? Math.round(d.apparent_temperature) : null
              const humidity = d ? d.relative_humidity_2m : null
              const wind = d ? Math.round(d.wind_speed_10m) : null
              const isHot = temp !== null && temp >= 30
              const isCold = temp !== null && temp < 10
              const bg = isHot ? '#FFFBEB' : isCold ? '#EFF6FF' : '#F8FAFC'
              const border = isHot ? '#FDE68A' : isCold ? '#BFDBFE' : '#E2E8F0'

              return (
                <div key={city} style={{ background: bg, borderRadius: 12, border: `1px solid ${border}`, padding: 16, transition: 'all 300ms' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <span style={{ fontSize: 15 }}>{flag}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>{city}</span>
                  </div>
                  {d && w ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 36 }}>{w.icon}</span>
                        <div>
                          <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', letterSpacing: '-1px', lineHeight: 1 }}>{temp}°C</div>
                          <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>Terasa {feels}°C</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 8 }}>{w.label}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#64748B' }}>
                          <i className="fi fi-rr-wind" style={{ fontSize: 11, color: '#94A3B8', lineHeight: 1, display: 'inline-flex', alignItems: 'center' }} />
                          Angin {wind} km/j
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#64748B' }}>
                          <i className="fi fi-rr-humidity" style={{ fontSize: 11, color: '#94A3B8', lineHeight: 1, display: 'inline-flex', alignItems: 'center' }} />
                          Kelembaban {humidity}%
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={{ padding: '16px 0', textAlign: 'center' }}>
                      <div style={{ fontSize: 20 }}>⚠️</div>
                      <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>Gagal memuat</div>
                    </div>
                  )}
                </div>
              )
            })
        }
      </div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  )
}

// ─── WORLD CLOCK ──────────────────────────────────────────────────────────────
const CITIES = [
  { name: 'Jakarta',   flag: '🇮🇩', tz: 'Asia/Jakarta'        },
  { name: 'New York',  flag: '🇺🇸', tz: 'America/New_York'    },
  { name: 'London',    flag: '🇬🇧', tz: 'Europe/London'       },
  { name: 'Hong Kong', flag: '🇭🇰', tz: 'Asia/Hong_Kong'      },
]


function getCityTime(tz: string) {
  const now = new Date()
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
    weekday: 'short', day: 'numeric', month: 'short',
  }).formatToParts(now)

  const get = (t: string) => parts.find(p => p.type === t)?.value ?? ''
  const h = parseInt(get('hour'))
  const m = get('minute')
  const s = get('second')
  const day = now.toLocaleDateString('en-US', { timeZone: tz, weekday: 'short' })
  const date = now.toLocaleDateString('en-US', { timeZone: tz, day: 'numeric', month: 'short' })

  const dayMap: Record<string, string> = { Sun:'Min', Mon:'Sen', Tue:'Sel', Wed:'Rab', Thu:'Kam', Fri:'Jum', Sat:'Sab' }
  const monMap: Record<string, string> = { Jan:'Jan', Feb:'Feb', Mar:'Mar', Apr:'Apr', May:'Mei', Jun:'Jun', Jul:'Jul', Aug:'Agu', Sep:'Sep', Oct:'Okt', Nov:'Nov', Dec:'Des' }

  const [, monRaw, dayNum] = date.match(/(\w+)\s+(\d+)/) ?? []
  const idDay = dayMap[day] ?? day
  const idMon = monMap[monRaw] ?? monRaw

  const isSiang = h >= 6 && h < 18
  const timeStr = `${String(h).padStart(2,'0')}.${m}.${s}`

  return { time: timeStr, date: `${idDay}, ${dayNum} ${idMon}`, isSiang }
}

function WorldClock() {
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: '22px 24px', boxShadow: '0 1px 3px rgba(15,23,42,0.06)', border: '1px solid #E2E8F0', marginBottom: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="fi fi-rr-globe" style={{ fontSize: 16, color: '#2563EB', lineHeight: 1, display: 'inline-flex', alignItems: 'center' }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Jam Dunia</span>
        </div>
        <span style={{ fontSize: 12, color: '#94A3B8' }}>Update tiap detik</span>
      </div>

      {/* City cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {CITIES.map(city => {
          const { time, date, isSiang } = getCityTime(city.tz)
          const dark = !isSiang
          return (
            <div key={city.name} style={{
              borderRadius: 12,
              padding: '16px 18px',
              background: dark ? '#1E293B' : '#F8FAFC',
              border: `1px solid ${dark ? '#334155' : '#E2E8F0'}`,
              transition: 'background 0.5s',
            }}>
              {/* City + badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 16 }}>{city.flag}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: dark ? '#E2E8F0' : '#0F172A' }}>{city.name}</span>
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                  background: isSiang ? '#FEF3C7' : '#1E293B',
                  color: isSiang ? '#D97706' : '#94A3B8',
                  border: `1px solid ${isSiang ? '#FDE68A' : '#334155'}`,
                }}>
                  {isSiang ? '☀️ Siang' : '🌙 Malam'}
                </span>
              </div>

              {/* Time */}
              <div style={{ fontSize: 26, fontWeight: 800, color: dark ? '#fff' : '#0F172A', letterSpacing: '-.5px', marginBottom: 4, fontVariantNumeric: 'tabular-nums' }}>
                {time}
              </div>

              {/* Date */}
              <div style={{ fontSize: 11, color: dark ? '#64748B' : '#94A3B8', fontWeight: 500 }}>
                {date}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

