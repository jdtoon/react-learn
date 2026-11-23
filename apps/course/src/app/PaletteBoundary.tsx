import { Component, type ReactNode } from 'react';

interface PaletteBoundaryState {
  failed: boolean;
}

export class PaletteBoundary extends Component<{ children: ReactNode }, PaletteBoundaryState> {
  state: PaletteBoundaryState = { failed: false };

  static getDerivedStateFromError(): PaletteBoundaryState {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <p role="alert" className="px-4 py-5 text-sm text-muted">
        Search could not load. Reload the page to try again.
      </p>
    );
  }
}
