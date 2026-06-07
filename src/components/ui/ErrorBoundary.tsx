import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 rounded-2xl bg-danger-500/10 border border-danger-500/20 flex items-center justify-center mb-6">
            <AlertTriangle className="w-10 h-10 text-danger-500" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white mb-3">Something went wrong</h1>
          <p className="text-surface-400 max-w-md mb-8">
            The application encountered an unexpected error. We've logged the issue and are looking into it.
          </p>
          
          <div className="bg-surface-900 border border-surface-800 rounded-xl p-4 max-w-2xl w-full text-left mb-8 overflow-auto max-h-48">
            <p className="text-sm font-mono text-danger-400 break-words">
              {this.state.error?.message || 'Unknown error'}
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={this.handleReset}
              className="px-6 py-3 bg-surface-800 hover:bg-surface-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              <RefreshCcw className="w-4 h-4" /> Try Again
            </button>
            <button
              onClick={this.handleHome}
              className="px-6 py-3 bg-primary-500 hover:bg-primary-400 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              <Home className="w-4 h-4" /> Go to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
