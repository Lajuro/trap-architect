export interface DifficultyLabel {
  label: string;
  color: string;
  emoji: string;
}

export function getDifficultyLabel(difficulty: number, plays: number): DifficultyLabel {
  if (plays < 10 || difficulty < 0) {
    return { label: "Novo", color: "#6B7280", emoji: "⚪" };
  }
  if (difficulty < 0.3) {
    return { label: "Fácil", color: "#22C55E", emoji: "🟢" };
  }
  if (difficulty < 0.6) {
    return { label: "Médio", color: "#EAB308", emoji: "🟡" };
  }
  if (difficulty < 0.8) {
    return { label: "Difícil", color: "#F97316", emoji: "🟠" };
  }
  return { label: "Extremo", color: "#EF4444", emoji: "🔴" };
}
