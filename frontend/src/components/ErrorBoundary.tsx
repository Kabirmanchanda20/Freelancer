import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { hasError: boolean; message: string }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || 'Something went wrong' }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-dvh items-center justify-center px-6">
          <div className="max-w-md text-center">
            <p className="font-display text-2xl font-semibold text-forest-800">CampusGigs</p>
            <h1 className="mt-3 text-lg font-semibold text-ink">Something broke</h1>
            <p className="mt-2 text-sm text-muted">{this.state.message}</p>
            <button
              type="button"
              className="mt-6 rounded-lg bg-forest-800 px-4 py-2 text-sm font-medium text-white"
              onClick={() => window.location.assign('/')}
            >
              Back to home
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
