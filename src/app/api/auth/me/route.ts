import { getSessionFromRequest } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/api";

export async function GET(request: Request) {
  const user = await getSessionFromRequest(request);
  if (!user) return errorResponse("Unauthorized", 401);
  return jsonResponse({ user });
}
