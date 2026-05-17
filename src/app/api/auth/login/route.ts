import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createToken, authCookieOptions } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/api";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return errorResponse("Email and password required");
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return errorResponse("Invalid credentials", 401);
    }

    const session = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      managerId: user.managerId,
    };

    const token = await createToken(session);
    const opts = authCookieOptions(token);
    const cookieStore = await cookies();
    cookieStore.set(opts);

    return jsonResponse({ user: session });
  } catch {
    return errorResponse("Login failed", 500);
  }
}
