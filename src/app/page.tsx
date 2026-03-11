import Link from "next/link";
import AuthNav from "@/components/AuthNav";
import HomeLevelFeed from "@/components/HomeLevelFeed";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">
            🐱 Trap Architect
          </h1>
          <AuthNav />
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-6 py-20 text-center">
          <h2 className="text-5xl md:text-7xl font-bold mb-6">
            Crie níveis{" "}
            <span className="text-primary">impossíveis</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Um platformer troll onde a comunidade é o arquiteto da diversão. 
            Construa armadilhas diabólicas, compartilhe com amigos e desafie o mundo.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/play"
              className="bg-primary text-primary-foreground px-8 py-3 rounded-lg text-lg font-bold hover:opacity-90 transition-opacity"
            >
              Jogar Agora
            </Link>
            <Link
              href="/editor"
              className="border border-border px-8 py-3 rounded-lg text-lg font-medium hover:bg-muted transition-colors"
            >
              Criar Nível
            </Link>
          </div>
        </section>

        {/* Featured Levels */}
        <HomeLevelFeed title="🔥 Níveis em Destaque" apiUrl="/api/levels?featured=true&limit=3" />

        {/* Recent Levels */}
        <HomeLevelFeed title="🕐 Níveis Recentes" apiUrl="/api/levels?sort=created_at&limit=3" />
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8">
        <div className="max-w-7xl mx-auto text-center text-muted-foreground text-sm">
          <p>Trap Architect — Feito com 🐱 e muita trollagem</p>
        </div>
      </footer>
    </div>
  );
}
