import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// ─── Types ────────────────────────────────────────────────

export interface AppUser {
  username: string;
  name: string;
  role: "admin" | "user";
}

interface StoredUser extends AppUser {
  passwordHash: string;
}

const SESSION_COOKIE = "session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// ─── Secret Key ───────────────────────────────────────────

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set and at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

// ─── Load Users from Env ──────────────────────────────────
// Format: USER_1_USERNAME=tommy
//         USER_1_PASSWORD_HASH=$2b$10$...
//         USER_1_NAME=Tommy
//         USER_1_ROLE=admin

function getStoredUsers(): StoredUser[] {
  const count = parseInt(process.env.USER_COUNT || "0", 10);
  const users: StoredUser[] = [];

  for (let i = 1; i <= Math.min(count, 20); i++) {
    const username = process.env[`USER_${i}_USERNAME`];
    const passwordHash = process.env[`USER_${i}_PASSWORD_HASH`];
    const name = process.env[`USER_${i}_NAME`] || username || "";
    const role = (process.env[`USER_${i}_ROLE`] as "admin" | "user") || "user";

    if (!username || !passwordHash) continue;

    users.push({ username: username.toLowerCase(), passwordHash, name, role });
  }

  return users;
}

// ─── Password Verification ────────────────────────────────
// Uses Web Crypto to compare against bcrypt-style hashes
// For simplicity, we use SHA-256 hashed passwords instead of bcrypt
// (bcrypt needs a Node.js runtime, not available in Edge middleware)
//
// Hash your passwords with: echo -n "yourpassword" | sha256sum
// Or use the /api/auth/hash endpoint in dev mode

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  const inputHash = await hashPassword(password);
  // Constant-time comparison
  if (inputHash.length !== storedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < inputHash.length; i++) {
    diff |= inputHash.charCodeAt(i) ^ storedHash.charCodeAt(i);
  }
  return diff === 0;
}

// ─── Authentication ───────────────────────────────────────

export async function authenticate(
  username: string,
  password: string
): Promise<AppUser | null> {
  const users = getStoredUsers();
  const user = users.find((u) => u.username === username.toLowerCase());

  if (!user) return null;

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return null;

  return { username: user.username, name: user.name, role: user.role };
}

// ─── Session (JWT) ────────────────────────────────────────

export async function createSession(user: AppUser): Promise<string> {
  const token = await new SignJWT({
    username: user.username,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecretKey());

  return token;
}

export async function verifySession(
  token: string
): Promise<AppUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return {
      username: payload.username as string,
      name: payload.name as string,
      role: payload.role as "admin" | "user",
    };
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<AppUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export { SESSION_COOKIE, SESSION_MAX_AGE, hashPassword };
