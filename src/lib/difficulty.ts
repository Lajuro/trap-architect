import type { PixelIconName } from "@/components/ui/PixelIcon";

export interface DifficultyLabel {
  labelKey: string;
  color: string;
  icon: PixelIconName;
}

export function getDifficultyLabel(difficulty: number, plays: number): DifficultyLabel {
  if (plays < 10 || difficulty < 0) {
    return { labelKey: "new", color: "#6B7280", icon: "diff-new" };
  }
  if (difficulty < 0.3) {
    return { labelKey: "easy", color: "#22C55E", icon: "diff-easy" };
  }
  if (difficulty < 0.6) {
    return { labelKey: "medium", color: "#EAB308", icon: "diff-medium" };
  }
  if (difficulty < 0.8) {
    return { labelKey: "hard", color: "#F97316", icon: "diff-hard" };
  }
  return { labelKey: "extreme", color: "#EF4444", icon: "diff-extreme" };
}
