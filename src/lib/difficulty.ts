import type { PixelIconName } from "@/components/ui/PixelIcon";

export interface DifficultyLabel {
  label: string;
  color: string;
  icon: PixelIconName;
}

export function getDifficultyLabel(difficulty: number, plays: number): DifficultyLabel {
  if (plays < 10 || difficulty < 0) {
    return { label: "Novo", color: "#6B7280", icon: "diff-new" };
  }
  if (difficulty < 0.3) {
    return { label: "Facil", color: "#22C55E", icon: "diff-easy" };
  }
  if (difficulty < 0.6) {
    return { label: "Medio", color: "#EAB308", icon: "diff-medium" };
  }
  if (difficulty < 0.8) {
    return { label: "Dificil", color: "#F97316", icon: "diff-hard" };
  }
  return { label: "Extremo", color: "#EF4444", icon: "diff-extreme" };
}
