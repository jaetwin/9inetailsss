import { useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

import Cursor from '../components/Cursor'
import MaintenancePage from '../components/MaintenancePage'

// Closes every page while maintenance is on (switched from /admin), except
// /admin itself so the owner can always sign in and switch it back. The server
// decides who is unlocked: an unlock pass from the lock page, or an admin login.
//
// It asks again on every page change and whenever the tab comes back into
// view, so signing out of /admin (which clears both passes) locks the site at
// the next click instead of at the next full reload.
export default function MaintenanceGate({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const [state, setState] = useState<'checking' | 'open' | 'locked'>('checking')

  useEffect(() => {
    let cancelled = false
    const check = () =>
      fetch('/api/maintenance', { cache: 'no-store' })
        .then((response) => {
          if (!response.ok) throw new Error(String(response.status))
          return response.json() as Promise<{ on?: boolean; unlocked?: boolean }>
        })
        .then((body) => !cancelled && setState(body.on && !body.unlocked ? 'locked' : 'open'))
        // Unsure means closed: when the check fails the shop can't load anyway.
        .catch(() => !cancelled && setState('locked'))

    void check()
    const onVisible = () => document.visibilityState === 'visible' && void check()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [pathname])

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
