import React from 'react';

type ErrorBoundaryState = { hasError: boolean };

type ErrorBoundaryProps = { children: React.ReactNode };

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Unhandled error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center text-center p-8 text-light-text dark:text-dark-text">
          <div>
            <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
            <p className="opacity-80">Please refresh the page or try again later.</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
