import { cookies } from "next/headers";
import { clearAuthCookie } from "@/lib/auth";
import { jsonResponse } from "@/lib/api";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set(clearAuthCookie());
  return jsonResponse({ ok: true });
}
