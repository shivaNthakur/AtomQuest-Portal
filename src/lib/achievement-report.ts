import { prisma } from "./prisma";
import { computeScore } from "./scoring";
import type { Role } from "@prisma/client";

export type AchievementReportRow = {
  employee: string;
  department: string;
  goal: string;
  thrust: string;
  uom: string;
  target: number;
  actual: number | string;
  score: number | string;
  status: string;
  weight: number;
};

export async function buildAchievementReportRows(
  user: { id: string; role: Role },
  cycleId: string | null
): Promise<AchievementReportRow[]> {
  const employeeFilter =
    user.role === "ADMIN" ? {} : { managerId: user.id };

  const employees = await prisma.user.findMany({
    where: { ...employeeFilter, role: "EMPLOYEE" },
  });

  const rows: AchievementReportRow[] = [];

  for (const emp of employees) {
    const goals = await prisma.goal.findMany({
      where: {
        employeeId: emp.id,
        status: "LOCKED",
        ...(cycleId && {
          achievements: { some: { cycleId } },
        }),
      },
      include: {
        thrustArea: true,
        achievements: cycleId
          ? { where: { cycleId } }
          : { take: 1, orderBy: { submittedAt: "desc" } },
      },
    });

    for (const g of goals) {
      const ach = g.achievements[0];
      const score = ach
        ? computeScore({
            uomType: g.uomType,
            target: g.target,
            actual: ach.actualValue,
            targetDate: g.targetDate,
            actualDate: ach.actualDate,
          })
        : null;

      rows.push({
        employee: emp.name,
        department: emp.department || "",
        goal: g.title,
        thrust: g.thrustArea.name,
        uom: g.uomType,
        target: g.target,
        actual: ach?.actualValue ?? "",
        score: score?.scorePercent ?? "",
        status: ach?.status ?? "NOT_STARTED",
        weight: g.weightage,
      });
    }
  }

  return rows;
}

export function rowsToCsv(rows: AchievementReportRow[]): string {
  const headers = [
    "Employee",
    "Department",
    "Goal",
    "Thrust Area",
    "UoM",
    "Target",
    "Actual",
    "Score %",
    "Status",
    "Weightage",
  ];

  const escape = (v: string | number) => {
    const s = String(v ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        r.employee,
        r.department,
        r.goal,
        r.thrust,
        r.uom,
        r.target,
        r.actual,
        r.score,
        r.status,
        r.weight,
      ]
        .map(escape)
        .join(",")
    ),
  ];

  return lines.join("\n");
}
