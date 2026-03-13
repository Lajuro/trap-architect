"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
      <p className="text-6xl mb-4">💥</p>
      <h1 className="text-3xl font-bold mb-2">Erro interno</h1>
      <p className="text-muted-foreground mb-6">
        Algo deu errado no servidor. Tente novamente.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90"
        >
          Tentar novamente
        </button>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/"
          className="px-6 py-2 border border-border rounded-lg hover:bg-muted"
        >
          Página Inicial
        </a>
      </div>
    </div>
  );
}
