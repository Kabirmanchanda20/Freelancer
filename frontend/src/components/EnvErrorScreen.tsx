import { envError } from '../lib/env'

export function EnvErrorScreen() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-6">
      <div className="max-w-lg text-center">
        <p className="font-display text-3xl font-semibold text-forest-800">CampusGigs</p>
        <h1 className="mt-4 text-xl font-semibold text-ink">Configuration required</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">{envError}</p>
      </div>
    </div>
  )
}
