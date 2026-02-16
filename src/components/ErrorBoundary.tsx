import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center p-4 bg-background">
                    <div className="text-center space-y-4 max-w-md">
                        <div className="flex justify-center">
                            <AlertTriangle className="h-12 w-12 text-destructive" />
                        </div>
                        <h1 className="text-2xl font-bold">Something went wrong</h1>
                        <p className="text-muted-foreground">
                            {this.state.error?.message || "An unexpected error occurred."}
                        </p>
                        <Button
                            onClick={() => window.location.reload()}
                            variant="default"
                        >
                            Reload Page
                        </Button>
                        <Button
                            onClick={() => window.location.href = "/"}
                            variant="outline"
                            className="ml-2"
                        >
                            Go Home
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
