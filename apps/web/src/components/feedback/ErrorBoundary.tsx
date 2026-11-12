/**
 * React Error Boundary — catches runtime errors in child component trees.
 * Renders a friendly error UI rather than a blank screen.
 * WCAG: Error state provides clear explanation and recovery action.
 */

import { Component, type ReactNode, type ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error instanceof Error ? error.message : 'An unexpected error occurred.',
    };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, info.componentStack);
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div role="alert" aria-live="assertive" className="p-8 text-center">
          <main id="main-content">
            <h1 className="text-2xl font-bold text-red-700">Something went wrong</h1>
            <p className="mt-2 text-slate-600">
              We encountered an unexpected error. Please refresh the page or contact your school
              administrator if the problem persists.
            </p>
            <button
              type="button"
              className="mt-4 px-4 py-2 bg-blue-700 text-white rounded-md"
              onClick={() => this.setState({ hasError: false, errorMessage: '' })}
            >
              Try again
            </button>
          </main>
        </div>
      );
    }
    return this.props.children;
  }
}
