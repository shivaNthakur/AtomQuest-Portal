export type UoMType =
  | "NUMERIC_MIN"
  | "NUMERIC_MAX"
  | "TIMELINE"
  | "ZERO_BASED";

export function computeScore({
  uomType,
  target,
  actual,
  targetDate,
  actualDate,
}: {
  uomType: UoMType;
  target: number;
  actual: number;
  targetDate?: Date | string | null;
  actualDate?: Date | string | null;
}) {
  let score = 0;
  let label = "";

  switch (uomType) {
    case "NUMERIC_MIN":
      score = target > 0 ? actual / target : 0;
      label = `${actual} / ${target}`;
      break;
    case "NUMERIC_MAX":
      if (actual === 0) score = 1;
      else score = target > 0 ? target / actual : 0;
      label = `${actual} (target ≤ ${target})`;
      break;
    case "TIMELINE": {
      if (!targetDate || !actualDate) {
        score = 0;
        label = "Dates not provided";
        break;
      }
      const deadline = new Date(targetDate).getTime();
      const completion = new Date(actualDate).getTime();
      if (completion <= deadline) {
        score = 1;
        label = "Completed on time";
      } else {
        const maxLate = 90 * 24 * 60 * 60 * 1000;
        const daysLate = completion - deadline;
        score = Math.max(0, 1 - daysLate / maxLate);
        const days = Math.round(daysLate / (24 * 60 * 60 * 1000));
        label = `${days} day(s) late`;
      }
      break;
    }
    case "ZERO_BASED":
      score = actual === 0 ? 1 : 0;
      label = actual === 0 ? "Zero incidents ✓" : `${actual} incident(s) recorded`;
      break;
    default:
      score = 0;
      label = "Unknown UoM";
  }

  score = Math.min(1, Math.max(0, score));
  return {
    score,
    scorePercent: Math.round(score * 100),
    label,
  };
}

export function computeOverallScore(
  goals: { weightage: number; scorePercent: number }[]
) {
  const totalWeight = goals.reduce((s, g) => s + g.weightage, 0);
  if (totalWeight === 0) return 0;
  const weighted = goals.reduce((s, g) => s + g.scorePercent * g.weightage, 0);
  return Math.round(weighted / totalWeight);
}
