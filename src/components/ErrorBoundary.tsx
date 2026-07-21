import { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode | ((error: unknown) => ReactNode);
  resetKey?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: unknown;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: undefined };

  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, error };
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: undefined });
    }
  }

  componentDidCatch(error: unknown) {
    console.error("UI boundary caught render error", error);
  }

  render() {
    if (this.state.hasError) {
      return typeof this.props.fallback === "function" ? this.props.fallback(this.state.error) : this.props.fallback;
    }

    return this.props.children;
  }
}
