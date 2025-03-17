import { Component } from "react";
import type { ReactNode } from "react";

interface ErrorProps {
  children: ReactNode;
}

interface ErrorState {
  error: boolean;
}

export class Error extends Component<ErrorProps, ErrorState> {
  constructor(props) {
    super(props);
    this.state = { error: false };
  }

  static getDerivedStateFromError(error) {
    return { error: true };
  }

  render() {
    const { error } = this.state;

    if (error) {
      return <div>Error</div>;
    }

    const { children } = this.props;

    return children;
  }
}
