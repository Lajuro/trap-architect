interface DevPickRibbonProps {
  category?: string | null;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  "Nível da Semana": { bg: "#FFD700", text: "#0a0a0a" },
  "Clássicos": { bg: "#C0C0C0", text: "#0a0a0a" },
  "Mais Troll": { bg: "#FF8C00", text: "#0a0a0a" },
  "Design Criativo": { bg: "#A855F7", text: "#FFF" },
};

const DEFAULT_RIBBON = { bg: "#FF69B4", text: "#FFF" };

export default function DevPickRibbon({ category }: DevPickRibbonProps) {
  const colors = (category && CATEGORY_COLORS[category]) || DEFAULT_RIBBON;
  const label = category || "DEV'S PICK";

  return (
    <div className="absolute top-0 right-0 overflow-hidden w-24 h-24 pointer-events-none z-10">
      <div
        className="absolute top-[10px] right-[-30px] w-[120px] text-center rotate-45"
        style={{
          backgroundColor: colors.bg,
          color: colors.text,
          fontSize: "6px",
          fontFamily: "'Press Start 2P', monospace",
          padding: "3px 0",
          letterSpacing: "0.5px",
          boxShadow: `0 2px 4px rgba(0,0,0,0.4)`,
          lineHeight: "1.4",
        }}
      >
        {label}
      </div>
    </div>
  );
}
