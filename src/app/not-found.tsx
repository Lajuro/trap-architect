import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
      <h1 className="text-[14px] font-bold mb-2 text-primary">[?] Pagina nao encontrada</h1>
      <p className="text-[9px] text-muted-foreground mb-6">
        O nivel que voce procura pode ter sido removido ou nunca existiu.
      </p>
      <div className="flex gap-3">
        <Link
          href="/browse"
          className="px-4 py-2 bg-primary text-primary-foreground border-2 border-primary text-[9px] font-bold uppercase tracking-wider hover:opacity-90"
        >
          Explorar Niveis
        </Link>
        <Link
          href="/"
          className="px-4 py-2 border-2 border-border text-[9px] font-bold uppercase tracking-wider hover:bg-muted"
        >
          Pagina Inicial
        </Link>
      </div>
    </div>
  );
}
