import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Bell, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { useUnreadNotificationCount } from '../features/notifications/api'
import { Button, buttonVariants } from './ui/Button'
import { cn } from '../lib/cn'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-forest-100 text-forest-900' : 'text-muted hover:bg-forest-50 hover:text-ink',
  )

export function Layout() {
  const { session, profile, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const isLanding = pathname === '/'
  const { data: unread = 0 } = useUnreadNotificationCount(!!session)

  const nav = (
    <>
      <NavLink to="/feed" className={linkClass} onClick={() => setOpen(false)}>
        Browse
      </NavLink>
      {session && (
        <>
          <NavLink to="/listings/new" className={linkClass} onClick={() => setOpen(false)}>
            Post
          </NavLink>
          <NavLink to="/my-tasks" className={linkClass} onClick={() => setOpen(false)}>
            My tasks
          </NavLink>
          <NavLink to="/analytics" className={linkClass} onClick={() => setOpen(false)}>
            Analytics
          </NavLink>
          <NavLink to="/messages" className={linkClass} onClick={() => setOpen(false)}>
            Messages
          </NavLink>
          <NavLink
            to="/notifications"
            className={linkClass}
            onClick={() => setOpen(false)}
          >
            <span className="inline-flex items-center gap-1.5">
              <Bell className="h-4 w-4" />
              Notifications
              {unread > 0 && (
                <span className="rounded-full bg-accent-500 px-1.5 text-[10px] font-semibold text-white">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </span>
          </NavLink>
          <NavLink to="/profile" className={linkClass} onClick={() => setOpen(false)}>
            Profile
          </NavLink>
          {profile?.is_admin && (
            <NavLink to="/admin" className={linkClass} onClick={() => setOpen(false)}>
              Admin
            </NavLink>
          )}
        </>
      )}
    </>
  )

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-surface/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to={session ? '/feed' : '/'} className="font-display text-xl font-semibold tracking-tight text-forest-900 sm:text-2xl">
            CampusGigs
          </Link>

          <nav className="hidden items-center gap-1 md:flex">{nav}</nav>

          <div className="flex items-center gap-2">
            {session ? (
              <>
                <span className="hidden text-xs font-medium text-muted sm:inline">
                  {Number(profile?.wallet_balance ?? 0)} cr
                </span>
                <Button variant="ghost" size="sm" onClick={() => void signOut()}>
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                  Log in
                </Link>
                <Link to="/signup" className={buttonVariants({ size: 'sm' })}>
                  Sign up
                </Link>
              </>
            )}
            <button
              type="button"
              className="rounded-md p-2 text-ink md:hidden"
              aria-label="Toggle menu"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {open && (
          <nav className="flex flex-col gap-1 border-t border-border px-4 py-3 md:hidden">
            {nav}
          </nav>
        )}
      </header>

      <main className={isLanding ? 'flex-1' : 'mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6'}>
        <Outlet />
      </main>

      <footer className="border-t border-border/70 py-6 text-center text-xs text-muted">
        CampusGigs · Thapar Institute · @thapar.edu only
      </footer>
    </div>
  )
}
