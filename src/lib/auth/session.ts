import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

let cachedSecretKey: Uint8Array | null = null;

/**
 * Safely resolves and validates the JWT signing secret.
 * Enforces strong secret configuration in production and prevents hardcoded secret leaks.
 */
function getSecretKey(): Uint8Array {
  if (cachedSecretKey) return cachedSecretKey;

  const secret = process.env.JWT_SECRET;
  const INSECURE_DEFAULT = "lis-counseling-portal-super-secret-key-2024";

  if (!secret || secret.trim() === "" || secret === INSECURE_DEFAULT) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "CRITICAL SECURITY CONFIGURATION ERROR: JWT_SECRET environment variable is missing or set to an insecure default. A high-entropy secret must be set in production."
      );
    }
    console.warn(
      "⚠️ [SECURITY WARNING] JWT_SECRET is not configured or using default. Using local development fallback key."
    );
    cachedSecretKey = new TextEncoder().encode("lis-portal-local-dev-fallback-key-32bytes-min!");
    return cachedSecretKey;
  }

  cachedSecretKey = new TextEncoder().encode(secret.trim());
  return cachedSecretKey;
}

export const SESSION_COOKIE_NAME = "lis_portal_session";

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: "ADMIN" | "COUNSELOR" | "VIEWER";
  mustChangePassword: boolean;
}

/**
 * Create a signed JWT session token (expires in 7 days)
 */
export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());
}

/**
 * Verify and decrypt a JWT session token
 */
export async function verifySessionTokenString(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Get current session from Next.js server cookies
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  if (!sessionCookie?.value) return null;
  return verifySessionTokenString(sessionCookie.value);
}

/**
 * Verify session from NextRequest (for Middleware)
 */
export async function verifySessionToken(request: NextRequest): Promise<SessionPayload | null> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionTokenString(token);
}
