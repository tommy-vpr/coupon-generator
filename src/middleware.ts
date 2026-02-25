import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// ─── IP Allowlist ─────────────────────────────────────────

const ALLOWED_IPS = (process.env.ALLOWED_IPS || "")
  .split(",")
  .map((ip) => ip.trim())
  .filter(Boolean);

const IP_RESTRICT_ENABLED = process.env.IP_RESTRICT_ENABLED === "true";

function getClientIp(request: NextRequest): string {
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "";
}

function isIpAllowed(clientIp: string): boolean {
  if (!IP_RESTRICT_ENABLED || ALLOWED_IPS.length === 0) return true;
  return ALLOWED_IPS.some((allowed) => {
    if (clientIp === allowed) return true;
    if (allowed.endsWith(".") && clientIp.startsWith(allowed)) return true;
    return false;
  });
}

// ─── Auth Check ───────────────────────────────────────────

const PUBLIC_PATHS = ["/login", "/api/auth", "/api/auth/hash"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get("session")?.value;
  if (!token) {
    console.log("[auth] No session cookie found");
    return false;
  }

  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    console.log(
      "[auth] SESSION_SECRET missing or too short:",
      secret?.length || 0,
    );
    return false;
  }

  try {
    const key = new TextEncoder().encode(secret);
    await jwtVerify(token, key);
    return true;
  } catch (err) {
    console.log("[auth] JWT verify failed:", (err as Error).message);
    return false;
  }
}

// ─── Middleware ────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/brands/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // ─── IP Check ─────────────────────────────────────────
  const clientIp = getClientIp(request);
  if (!isIpAllowed(clientIp)) {
    return new NextResponse(JSON.stringify({ error: "Access denied" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ─── Auth Check ───────────────────────────────────────
  if (!isPublicPath(pathname)) {
    const authed = await isAuthenticated(request);

    if (!authed) {
      // API routes get 401, pages get redirected
      if (pathname.startsWith("/api/")) {
        return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // If already logged in and visiting /login, redirect to home
  if (pathname === "/login") {
    const authed = await isAuthenticated(request);
    if (authed) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  const response = NextResponse.next();

  // ─── CORS (API routes only) ───────────────────────────
  if (pathname.startsWith("/api")) {
    const activeBrandId = request.cookies.get("active_brand")?.value;
    let allowedOrigin = "";

    if (activeBrandId) {
      const index = activeBrandId.replace("brand_", "");
      allowedOrigin = process.env[`BRAND_${index}_ALLOWED_ORIGIN`] || "";
    }
    if (!allowedOrigin) {
      allowedOrigin = process.env.BRAND_1_ALLOWED_ORIGIN || "";
    }

    const requestOrigin = request.headers.get("origin") || "";
    const count = parseInt(process.env.BRAND_COUNT || "0", 10);
    const allAllowedOrigins: string[] = [];
    for (let i = 1; i <= count; i++) {
      const origin = process.env[`BRAND_${i}_ALLOWED_ORIGIN`];
      if (origin) allAllowedOrigins.push(origin);
    }

    const devOrigins = [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3000",
    ];

    const isAllowed =
      allAllowedOrigins.includes(requestOrigin) ||
      devOrigins.includes(requestOrigin);

    if (isAllowed) {
      response.headers.set("Access-Control-Allow-Origin", requestOrigin);
    } else if (allowedOrigin) {
      response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
    }

    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS",
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Access-Control-Max-Age", "86400");

    if (request.method === "OPTIONS") {
      return new NextResponse(null, { status: 204, headers: response.headers });
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)",
  ],
};
