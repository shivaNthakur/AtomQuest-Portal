import { requireSessionFromRequest } from "@/lib/auth";
import {
  buildAchievementReportRows,
  rowsToCsv,
} from "@/lib/achievement-report";
import { errorResponse, handleApiError } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const user = await requireSessionFromRequest(request);
    if (user.role === "EMPLOYEE") return errorResponse("Forbidden", 403);

    const { searchParams } = new URL(request.url);
    const cycleId = searchParams.get("cycleId");
    const rows = await buildAchievementReportRows(user, cycleId);
    const csv = rowsToCsv(rows);

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="atomquest-achievement-report.csv"',
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
