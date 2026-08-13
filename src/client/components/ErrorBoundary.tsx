import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{
          padding: 'var(--space-10)',
          textAlign: 'center',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
          margin: 'var(--space-8)',
        }}>
          <h2 style={{ 
            fontSize: 'var(--text-2xl)', 
            fontWeight: 'var(--font-semibold)',
            marginBottom: 'var(--space-4)',
          }}>
            Something went wrong
          </h2>
          <p style={{ 
            color: 'var(--text-muted)', 
            marginBottom: 'var(--space-6)',
            fontSize: 'var(--text-base)',
          }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: 'var(--space-3) var(--space-6)',
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-medium)',
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Fallback error component for more detailed errors
export function ErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div style={{
      padding: 'var(--space-10)',
      textAlign: 'center',
      background: 'rgba(239, 68, 68, 0.05)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid rgba(239, 68, 68, 0.2)',
      margin: 'var(--space-8)',
    }}>
      <h2 style={{ 
        fontSize: 'var(--text-2xl)', 
        fontWeight: 'var(--font-semibold)',
        color: 'var(--down)',
        marginBottom: 'var(--space-4)',
      }}>
        Application Error
      </h2>
      <pre style={{
        fontSize: 'var(--text-sm)',
        color: 'var(--text-muted)',
        background: 'var(--bg-elevated)',
        padding: 'var(--space-4)',
        borderRadius: 'var(--radius-sm)',
        overflow: 'auto',
        marginBottom: 'var(--space-6)',
        fontFamily: 'var(--mono)',
      }}>
        {error.stack}
      </pre>
      <button
        onClick={resetError}
        style={{
          padding: 'var(--space-3) var(--space-6)',
          background: 'var(--accent)',
          color: 'white',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          cursor: 'pointer',
          fontSize: 'var(--text-base)',
          fontWeight: 'var(--font-medium)',
        }}
      >
        Try Again
      </button>
    </div>
  );
}
