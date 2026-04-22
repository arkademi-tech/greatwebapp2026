import { NavLink } from 'react-router-dom'
import { Avatar } from './ui/Avatar'
import type { Team, Member } from '../types/database'

const NAV = [
  { to: '/',             icon: 'home',      label: 'Dashboard'      },
  { to: '/expenses',     icon: 'receipt',   label: 'Pengeluaran'    },
  { to: '/expenses/new', icon: 'plus',      label: 'Tambah Baru'    },
  { to: '/settlement',   icon: 'chart-pie', label: 'Rekap & Hutang' },
]

interface Props {
  team: Team
  members: Member[]
  currentMemberId: string
  onLogout: () => void
}

export function Sidebar({ team, members, currentMemberId, onLogout }: Props) {
  const me = members.find(m => m.id === currentMemberId)
  const shareUrl = `${window.location.origin}/join/${team.share_token}`

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl)
  }

  return (
    <aside style={{
      width: 240, background: '#0F172A', display: 'flex', flexDirection: 'column',
      flexShrink: 0, height: '100%', padding: '0 12px',
    }}>
      {/* Logo */}
      <div style={{ padding: '22px 12px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="fi fi-rr-split" style={{ fontSize: 16, color: '#fff', lineHeight: 1, display: 'inline-flex', alignItems: 'center' }} />
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: '-.3px' }}>SplitMate</div>
          <div style={{ fontSize: 10, color: '#64748B', fontWeight: 500 }}>Tim Freelance</div>
        </div>
      </div>

      {/* Team card */}
      <div style={{ margin: '0 0 16px', padding: '10px 12px', background: '#1E293B', borderRadius: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: '#64748B', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.05em' }}>
          {team.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          {members.slice(0, 5).map((m, i) => (
            <div key={m.id} style={{ marginLeft: i > 0 ? -6 : 0, borderRadius: '50%', border: '2px solid #1E293B' }}>
              <Avatar name={m.name} size={26} index={i} />
            </div>
          ))}
          <span style={{ marginLeft: 8, fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>{members.length} anggota</span>
        </div>
        <button
          onClick={copyShareLink}
          style={{
            display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: '1px solid #334155',
            borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: '#94A3B8', fontSize: 11, fontWeight: 500,
          }}
        >
          <i className="fi fi-rr-link" style={{ fontSize: 11, lineHeight: 1, display: 'inline-flex', alignItems: 'center' }} /> Salin Link Tim
        </button>
      </div>

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {NAV.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 8,
              background: isActive ? '#334155' : 'none',
              color: isActive ? '#fff' : '#94A3B8',
              textDecoration: 'none', fontSize: 13,
              fontWeight: isActive ? 600 : 400,
              transition: 'all 150ms',
            })}
          >
            {({ isActive }) => (
              <>
                <i className={`fi fi-rr-${icon}`} style={{ fontSize: 16, color: isActive ? '#2563EB' : '#64748B', flexShrink: 0, lineHeight: 1, display: 'inline-flex', alignItems: 'center' }} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid #334155', display: 'flex', alignItems: 'center', gap: 10 }}>
        {me && <Avatar name={me.name} size={30} />}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#E2E8F0' }}>{me?.name ?? 'Saya'}</div>
          <div style={{ fontSize: 10, color: '#64748B' }}>Anggota</div>
        </div>
        <button onClick={onLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }} title="Keluar">
          <i className="fi fi-rr-sign-out-alt" style={{ fontSize: 14, lineHeight: 1, display: 'inline-flex', alignItems: 'center' }} />
        </button>
      </div>
    </aside>
  )
}

/* Mobile bottom nav */
export function BottomNav() {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, height: 60,
      background: '#0F172A', display: 'flex', zIndex: 100,
      borderTop: '1px solid #334155',
    }}>
      {NAV.map(({ to, icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          style={({ isActive }) => ({
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 3,
            textDecoration: 'none', color: isActive ? '#2563EB' : '#94A3B8',
            transition: 'color 150ms',
          })}
        >
          {({ isActive }) => (
            <>
              <i className={`fi fi-rr-${icon}`} style={{ fontSize: 18, lineHeight: 1, display: 'inline-flex', alignItems: 'center', color: isActive ? '#2563EB' : '#94A3B8' }} />
              <span style={{ fontSize: 10, fontWeight: 600 }}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
