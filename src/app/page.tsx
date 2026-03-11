import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">
            🐱 Trap Architect
          </h1>
          <nav className="flex items-center gap-4">
            <Link
              href="/browse"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Explorar
            </Link>
            <Link
              href="/editor"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Criar Nível
            </Link>
            <Link
              href="/login"
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:opacity-90 transition-opacity"
            >
              Entrar
            </Link>
          </nav>
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

        {/* Featured Levels Placeholder */}
        <section className="max-w-7xl mx-auto px-6 py-12">
          <h3 className="text-2xl font-bold mb-6">🔥 Níveis em Destaque</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors"
              >
                <div className="h-40 bg-muted rounded-md mb-4 flex items-center justify-center text-muted-foreground">
                  Preview do Nível
                </div>
                <h4 className="font-bold mb-1">Nível em Breve</h4>
                <p className="text-sm text-muted-foreground">
                  Níveis da comunidade aparecerão aqui
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Levels Placeholder */}
        <section className="max-w-7xl mx-auto px-6 py-12">
          <h3 className="text-2xl font-bold mb-6">🕐 Níveis Recentes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors"
              >
                <div className="h-40 bg-muted rounded-md mb-4 flex items-center justify-center text-muted-foreground">
                  Preview do Nível
                </div>
                <h4 className="font-bold mb-1">Nível em Breve</h4>
                <p className="text-sm text-muted-foreground">
                  Níveis da comunidade aparecerão aqui
                </p>
              </div>
            ))}
          </div>
        </section>
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
