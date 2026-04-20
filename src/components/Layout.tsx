import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Sidebar, BottomNav } from './Sidebar'
import { ToastContainer } from './ui/Toast'
import { useApp } from '../context/AppContext'
import { useTeam } from '../context/TeamContext'

export function Layout() {
  const { toasts } = useApp()
  const { team, members, session, logout } = useTeam()
  const navigate = useNavigate()
  const [mobile, setMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  if (!session || !team) return null

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {!mobile && (
        <Sidebar
          team={team}
          members={members}
          currentMemberId={session.memberId}
          onLogout={() => { logout(); navigate('/') }}
        />
      )}

      <main style={{
        flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column',
        paddingBottom: mobile ? 60 : 0,
      }}>
        <Outlet />
      </main>

      {mobile && <BottomNav />}
      <ToastContainer toasts={toasts} />
    </div>
  )
}
