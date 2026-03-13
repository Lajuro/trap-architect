"use client";

import React from "react";

interface ErrorBoundaryProps {
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-8 text-center">
          <p className="text-2xl mb-2">Algo deu errado 😿</p>
          <p className="text-muted-foreground mb-4 text-sm">
            Um erro inesperado aconteceu.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
            >
              Recarregar
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted"
            >
              Voltar ao Início
            </a>
          </div>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <details className="mt-4 text-left text-xs text-muted-foreground max-w-lg">
              <summary className="cursor-pointer">Detalhes do erro</summary>
              <pre className="mt-2 p-2 bg-muted rounded overflow-auto">
                {this.state.error.message}
                {"\n"}
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

/** Error boundary specific to game canvas crashes */
export function GameErrorFallback() {
  return (
    <div className="w-full max-w-[800px] aspect-[800/480] mx-auto rounded-lg overflow-hidden border-2 border-border flex items-center justify-center bg-muted/50">
      <div className="text-center p-8">
        <p className="text-xl mb-2">O jogo travou 💥</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
        >
          Clique para reiniciar
        </button>
      </div>
    </div>
  );
}
