import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";

// GET /api/auth/hash?password=yourpassword
// Only works in development mode
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 }
    );
  }

  const password = request.nextUrl.searchParams.get("password");

  if (!password) {
    return NextResponse.json(
      { error: "Provide ?password=yourpassword" },
      { status: 400 }
    );
  }

  const hash = await hashPassword(password);

  return NextResponse.json({
    password,
    hash,
    env_format: `USER_N_PASSWORD_HASH=${hash}`,
  });
}
