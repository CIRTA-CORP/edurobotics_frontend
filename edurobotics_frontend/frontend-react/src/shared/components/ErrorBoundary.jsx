import React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from './button'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  reset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-lg border border-red-200 shadow-sm p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">
                    Algo salió mal
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    {this.state.error?.message || 'Error desconocido'}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={this.reset}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Intentar de nuevo
                    </Button>
                    <Button
                      onClick={() => window.location.href = '/'}
                      variant="outline"
                    >
                      Ir a inicio
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
