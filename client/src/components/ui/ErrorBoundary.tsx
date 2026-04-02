import { AlertTriangle } from 'lucide-react';
import { Component, type ErrorInfo, type PropsWithChildren, type ReactNode } from 'react';

import { Button } from './Button';
import { Card } from './Card';

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<
  PropsWithChildren,
  ErrorBoundaryState
> {
  public constructor(props: PropsWithChildren) {
    super(props);
    this.state = {
      hasError: false,
    };
  }

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    void error;
    void errorInfo;
  }

  public override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-6">
          <Card className="w-full p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-error/10 text-brand-error">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h1 className="font-heading text-3xl text-text-primary">
              Something broke unexpectedly
            </h1>
            <p className="mt-3 text-text-secondary">
              Refresh the page to try again. If the problem persists, check the server
              logs and API environment variables.
            </p>
            <div className="mt-6 flex justify-center">
              <Button onClick={() => window.location.reload()}>Reload</Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
