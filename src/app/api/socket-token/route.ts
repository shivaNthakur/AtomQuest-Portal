import { requireSessionFromRequest, createToken } from "@/lib/auth";
import { errorResponse, jsonResponse, handleApiError } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const user = await requireSessionFromRequest(request);
    const token = await createToken(user);
    return jsonResponse({ token });
  } catch (err) {
    return handleApiError(err);
  }
}
