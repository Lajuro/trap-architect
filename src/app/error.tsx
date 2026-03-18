"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
      <h1 className="text-[14px] font-bold mb-2 text-primary">[!] Erro interno</h1>
      <p className="text-[9px] text-muted-foreground mb-6">
        Algo deu errado no servidor. Tente novamente.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-4 py-2 bg-primary text-primary-foreground border-2 border-primary text-[9px] font-bold uppercase tracking-wider hover:opacity-90"
        >
          Tentar novamente
        </button>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/"
          className="px-4 py-2 border-2 border-border text-[9px] font-bold uppercase tracking-wider hover:bg-muted"
        >
          Pagina Inicial
        </a>
      </div>
    </div>
  );
}
