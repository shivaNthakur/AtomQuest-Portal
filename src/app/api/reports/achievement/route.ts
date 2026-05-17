import ExcelJS from "exceljs";
import { requireSessionFromRequest } from "@/lib/auth";
import { buildAchievementReportRows } from "@/lib/achievement-report";
import { errorResponse, handleApiError } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const user = await requireSessionFromRequest(request);
    if (user.role === "EMPLOYEE") return errorResponse("Forbidden", 403);

    const { searchParams } = new URL(request.url);
    const cycleId = searchParams.get("cycleId");
    const rows = await buildAchievementReportRows(user, cycleId);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Achievement Report");

    sheet.columns = [
      { header: "Employee", key: "employee", width: 22 },
      { header: "Department", key: "department", width: 16 },
      { header: "Goal", key: "goal", width: 36 },
      { header: "Thrust Area", key: "thrust", width: 20 },
      { header: "UoM", key: "uom", width: 14 },
      { header: "Target", key: "target", width: 12 },
      { header: "Actual", key: "actual", width: 12 },
      { header: "Score %", key: "score", width: 10 },
      { header: "Status", key: "status", width: 14 },
      { header: "Weightage", key: "weight", width: 10 },
    ];

    for (const r of rows) {
      sheet.addRow({
        employee: r.employee,
        department: r.department,
        goal: r.goal,
        thrust: r.thrust,
        uom: r.uom,
        target: r.target,
        actual: r.actual,
        score: r.score,
        status: r.status,
        weight: r.weight,
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new Response(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          'attachment; filename="atomquest-achievement-report.xlsx"',
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
