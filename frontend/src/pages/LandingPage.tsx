import { Link, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ArrowRight, BookOpen, Briefcase, GraduationCap, Star, Users, Zap } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { useTasks } from '../features/tasks/api'
import { PublicListingCard } from '../components/PublicListingCard'
import { buttonVariants } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'

/* ── typewriter cycling phrases ─────────────────────────── */
const PHRASES = [
  'Fix my React bug 🐛',
  'Host a ML workshop 🤖',
  'Need DBMS tutor 📚',
  'Review my portfolio 🎨',
  'Dockerize my project 🐳',
  'GitHub workflow help 🔀',
  'Mentor for internships 🎯',
]

function useTypewriter(phrases: string[], speed = 60, pause = 1800) {
  const [display, setDisplay] = useState('')
  const [phraseIdx, setPhraseIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const current = phrases[phraseIdx]!
    const timeout = setTimeout(
      () => {
        if (!deleting) {
          if (charIdx < current.length) {
            setDisplay(current.slice(0, charIdx + 1))
            setCharIdx((c) => c + 1)
          } else {
            setTimeout(() => setDeleting(true), pause)
          }
        } else {
          if (charIdx > 0) {
            setDisplay(current.slice(0, charIdx - 1))
            setCharIdx((c) => c - 1)
          } else {
            setDeleting(false)
            setPhraseIdx((i) => (i + 1) % phrases.length)
          }
        }
      },
      deleting ? speed / 2 : speed,
    )
    return () => clearTimeout(timeout)
  }, [charIdx, deleting, phraseIdx, phrases, speed, pause])

  return display
}

/* ── stats ──────────────────────────────────────────────── */
const STATS = [
  { value: '500+', label: 'Campus members' },
  { value: '12', label: 'Departments' },
  { value: '4', label: 'Listing types' },
  { value: '100%', label: 'Free to join' },
]

/* ── how it works ───────────────────────────────────────── */
const HOW_IT_WORKS = [
  {
    icon: GraduationCap,
    title: 'Sign up with @thapar.edu',
    desc: 'Only verified Thapar emails. No spam, no strangers.',
    color: 'text-teal-500 bg-teal-500/10',
  },
  {
    icon: Briefcase,
    title: 'Browse or post a listing',
    desc: 'Post gigs, workshops, projects, or mentorship in under 2 minutes.',
    color: 'text-accent-500 bg-accent-100',
  },
  {
    icon: Users,
    title: 'Connect & collaborate',
    desc: 'Accept applicants, message in-thread, and get the work done on campus.',
    color: 'text-forest-500 bg-forest-100',
  },
  {
    icon: Star,
    title: 'Build your campus rep',
    desc: 'Leave reviews, collect ratings, and grow your campus portfolio.',
    color: 'text-violet-500 bg-violet-50',
  },
]

/* ── listing type chips ─────────────────────────────────── */
const LISTING_TYPES_PREVIEW = [
  { label: 'Gig', icon: Zap, color: 'bg-teal-500/10 text-teal-600 ring-teal-200' },
  { label: 'Workshop', icon: BookOpen, color: 'bg-accent-100 text-accent-600 ring-accent-200' },
  { label: 'Project', icon: Briefcase, color: 'bg-forest-100 text-forest-700 ring-forest-200' },
  { label: 'Mentorship', icon: GraduationCap, color: 'bg-violet-50 text-violet-700 ring-violet-200' },
]

export function LandingPage() {
  const { session, loading } = useAuth()
  const typed = useTypewriter(PHRASES)
  const { data, isLoading: listingsLoading } = useTasks({ status: 'open' })
  const listings = (data?.pages.flat() ?? []).slice(0, 6)

  if (!loading && session) return <Navigate to="/feed" replace />

  return (
    <div className="overflow-x-hidden">

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative flex min-h-[92dvh] flex-col items-center justify-center py-16 text-center">
        {/* background blobs */}
        <div aria-hidden className="pointer-events-none absolute -right-24 top-0 h-96 w-96 rounded-full bg-teal-500/12 blur-3xl animate-drift" />
        <div aria-hidden className="pointer-events-none absolute -left-16 bottom-8 h-72 w-72 rounded-full bg-forest-400/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-accent-500/8 blur-3xl animate-drift" style={{ animationDelay: '2s' }} />

        {/* eye-catch pill */}
        <div className="animate-fade-up mb-5 inline-flex items-center gap-2 rounded-full border border-teal-300/50 bg-teal-500/8 px-4 py-1.5 text-sm font-medium text-teal-700">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
          Live on Thapar campus
        </div>

        {/* headline */}
        <h1 className="animate-fade-up font-display text-5xl font-bold leading-tight tracking-tight text-forest-900 sm:text-6xl md:text-7xl lg:text-8xl">
          Your campus,<br />
          <span className="text-teal-600">your gigs.</span>
        </h1>

        <p className="animate-fade-up-delay mt-5 max-w-lg text-lg text-muted sm:text-xl">
          Post and discover gigs, workshops, projects & mentorship — built exclusively for{' '}
          <span className="font-semibold text-forest-800">@thapar.edu</span>.
        </p>

        {/* typewriter search bar */}
        <div className="animate-fade-up-delay mt-8 flex w-full max-w-md items-center gap-2 rounded-2xl border border-border/80 bg-white/80 px-4 py-3 shadow-md backdrop-blur-md ring-1 ring-teal-300/20">
          <svg className="h-4 w-4 shrink-0 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" /></svg>
          <span className="flex-1 text-left text-sm text-muted">
            {typed}
            <span className="ml-0.5 inline-block h-4 w-px animate-pulse bg-teal-500 align-middle" />
          </span>
          <Link to="/feed" className="shrink-0 rounded-xl bg-forest-900 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-forest-700">
            Browse
          </Link>
        </div>

        {/* listing type chips */}
        <div className="animate-fade-up-delay mt-8 flex flex-wrap justify-center gap-2.5">
          {LISTING_TYPES_PREVIEW.map(({ label, icon: Icon, color }) => (
            <span key={label} className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 ${color}`}>
              <Icon className="h-4 w-4" />
              {label}
            </span>
          ))}
        </div>

        {/* CTAs */}
        <div className="animate-fade-up-delay mt-10 flex flex-wrap justify-center gap-3">
          <Link to="/signup" className={buttonVariants({ size: 'lg' })}>
            Join free with @thapar.edu
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <Link to="/feed" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
            Browse listings
          </Link>
        </div>

        {/* scroll hint */}
        <p className="animate-fade-up-delay mt-14 text-xs text-muted/60 tracking-wider uppercase">↓ See what's live now</p>
      </section>

      {/* ── STATS BAR ─────────────────────────────────────── */}
      <section className="border-y border-border/60 bg-white/60 backdrop-blur-sm py-8">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 px-6 sm:grid-cols-4">
          {STATS.map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center gap-1 text-center">
              <span className="font-display text-3xl font-bold text-forest-900">{value}</span>
              <span className="text-sm text-muted">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── LIVE LISTINGS ─────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-600 mb-1">Live right now</p>
            <h2 className="font-display text-3xl font-bold text-forest-900 sm:text-4xl">
              Open listings on campus
            </h2>
            <p className="mt-2 text-muted">Real work posted by Thapar students, faculty, and clubs.</p>
          </div>
          <Link to="/feed" className={buttonVariants({ variant: 'outline' })}>
            View all listings <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </div>

        {listingsLoading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : listings.length === 0 ? (
          <div className="rounded-2xl border border-border/60 bg-white/50 py-16 text-center text-muted">
            <p className="font-display text-xl">No listings yet.</p>
            <p className="mt-1 text-sm">Be the first to post one!</p>
            <Link to="/signup" className={`${buttonVariants()} mt-4 inline-flex`}>Get started</Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((task) => (
              <PublicListingCard key={task.id} task={task} />
            ))}
          </div>
        )}

        {/* blurred CTA overlay */}
        <div className="relative mt-6 overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-transparent to-surface/90 px-6 pb-8 pt-2 text-center">
          <p className="text-sm text-muted mb-3">
            Showing 6 of many open listings. Sign up to see all of them and apply.
          </p>
          <Link to="/signup" className={buttonVariants()}>
            Join to see everything
          </Link>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────── */}
      <section className="border-t border-border/60 bg-forest-950 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-teal-400">How it works</p>
          <h2 className="font-display text-center text-3xl font-bold text-white sm:text-4xl">
            Get started in 4 steps
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map(({ icon: Icon, title, desc, color }, i) => (
              <div key={title} className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl text-white/20 font-display text-lg font-bold border border-white/10">
                    {i + 1}
                  </span>
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
                <p className="text-sm leading-relaxed text-white/60">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────── */}
      <section className="relative overflow-hidden py-24">
        <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-96 w-96 rounded-full bg-teal-500/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-2xl px-6 text-center">
          <h2 className="font-display text-4xl font-bold text-forest-900 sm:text-5xl">
            Ready to earn, learn,<br />or share skills?
          </h2>
          <p className="mt-4 text-lg text-muted">
            Join hundreds of Thapar students and faculty already on CampusGigs.
          </p>
          <Link to="/signup" className={`${buttonVariants({ size: 'lg' })} mt-8 inline-flex`}>
            Sign up with @thapar.edu — it's free
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <p className="mt-4 text-xs text-muted">No payment required. Campus emails only.</p>
        </div>
      </section>
    </div>
  )
}
