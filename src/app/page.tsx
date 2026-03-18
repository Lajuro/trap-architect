import HomeLevelFeed from "@/components/HomeLevelFeed";
import HudBar from "@/components/ui/HudBar";
import HudButton from "@/components/ui/HudButton";
import FloatingBackground from "@/components/ui/FloatingBackground";
import { PixelIcon } from "@/components/ui/PixelIcon";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <HudBar />

      {/* Hero */}
      <main className="flex-1">
        <section className="relative max-w-7xl mx-auto px-4 py-16 text-center overflow-hidden">
          <FloatingBackground count={18} />
          <div className="relative z-10 flex flex-col items-center gap-6">
            <PixelIcon name="cat" size={64} color="#ff8c00" />
            <h2 className="text-sm md:text-base font-bold uppercase tracking-wider leading-relaxed">
              Crie niveis{" "}
              <span className="text-primary">impossiveis</span>
            </h2>
            <p className="text-[9px] text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Um platformer troll onde a comunidade e o arquiteto da diversao.
              Construa armadilhas diabolicas, compartilhe e desafie o mundo.
            </p>
            <div className="flex items-center justify-center gap-3">
              <HudButton href="/play" variant="primary">
                <PixelIcon name="play" size={14} /> Jogar
              </HudButton>
              <HudButton href="/editor" variant="secondary">
                <PixelIcon name="create" size={14} /> Criar
              </HudButton>
            </div>
          </div>
        </section>

        {/* Featured Levels */}
        <HomeLevelFeed
          title="Destaque"
          apiUrl="/api/levels?featured=true&limit=3"
          icon={<PixelIcon name="star" size={14} color="#FFD700" />}
        />

        {/* Recent Levels */}
        <HomeLevelFeed
          title="Recentes"
          apiUrl="/api/levels?sort=created_at&limit=3"
          icon={<PixelIcon name="clock" size={14} color="#ff8c00" />}
        />
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-border px-4 py-6">
        <div className="max-w-7xl mx-auto text-center text-muted-foreground text-[8px] uppercase tracking-wider flex items-center justify-center gap-2">
          <PixelIcon name="cat" size={10} />
          <span>Trap Architect — Feito com muita trollagem</span>
        </div>
      </footer>
    </div>
  );
}
