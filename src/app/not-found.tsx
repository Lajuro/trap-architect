import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
      <p className="text-6xl mb-4">🕳️</p>
      <h1 className="text-3xl font-bold mb-2">Página não encontrada</h1>
      <p className="text-muted-foreground mb-6">
        O nível que você procura pode ter sido removido ou nunca existiu.
      </p>
      <div className="flex gap-3">
        <Link
          href="/browse"
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90"
        >
          Explorar Níveis
        </Link>
        <Link
          href="/"
          className="px-6 py-2 border border-border rounded-lg hover:bg-muted"
        >
          Página Inicial
        </Link>
      </div>
    </div>
  );
}
