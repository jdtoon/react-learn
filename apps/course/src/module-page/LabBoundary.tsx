import { Component, type ReactNode } from 'react';

interface LabBoundaryProps {
  fallback: (error: Error) => ReactNode;
  children: ReactNode;
}

interface LabBoundaryState {
  error: Error | null;
}

export class LabBoundary extends Component<LabBoundaryProps, LabBoundaryState> {
  state: LabBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): LabBoundaryState {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  render() {
    return this.state.error ? this.props.fallback(this.state.error) : this.props.children;
  }
}
