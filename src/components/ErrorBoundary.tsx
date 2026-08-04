import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertOctagon, RotateCw } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

/** Catches render-time errors anywhere below it so a single broken component shows a fallback screen instead of a blank white page. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Erro não tratado:', error, errorInfo)
  }

  handleReload = () => {
    this.setState({ error: null })
    window.location.reload()
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="flex min-h-svh items-center justify-center bg-background p-4">
        <div className="glass-panel w-full max-w-sm rounded-xl p-8 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertOctagon className="size-6" />
          </span>
          <h1 className="mt-4 text-lg font-medium text-foreground">Algo deu errado</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Um erro inesperado aconteceu nesta tela. Seus dados estão salvos — tente recarregar a página.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <RotateCw className="size-4" />
            Recarregar
          </button>
        </div>
      </div>
    )
  }
}
