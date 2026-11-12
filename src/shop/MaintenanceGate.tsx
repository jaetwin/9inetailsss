import { useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

import Cursor from '../components/Cursor'
import MaintenancePage from '../components/MaintenancePage'

// Closes every page while maintenance is on (switched from /admin), except
// /admin itself so the owner can always sign in and switch it back. The server
// decides who is unlocked: an unlock pass from the lock page, or an admin login.
export default function MaintenanceGate({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const [state, setState] = useState<'checking' | 'open' | 'locked'>('checking')

  useEffect(() => {
    let cancelled = false
    fetch('/api/maintenance')
      .then((response) => response.json())
      .then((body: { on?: boolean; unlocked?: boolean }) => {
        if (!cancelled) setState(body.on && !body.unlocked ? 'locked' : 'open')
      })
      // If the check itself fails, don't lock buyers out of a working shop.
      .catch(() => !cancelled && setState('open'))
    return () => {
      cancelled = true
    }
  }, [])

  if (pathname.startsWith('/admin')) return <>{children}</>
  if (state === 'checking') return <div className="min-h-[100dvh] w-full bg-[var(--void)]" />
  if (state === 'locked') {
    return (
      <>
        <Cursor />
        <MaintenancePage onUnlock={() => setState('open')} />
      </>
    )
  }
  return <>{children}</>
}
