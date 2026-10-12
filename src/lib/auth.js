import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

const JWT_SECRET_STRING = process.env.JWT_SECRET || "super-secret-key-conciliacion-jwt-auth-2026-secure-token";
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET_STRING);
export const AUTH_COOKIE_NAME = "auth_token";

export const SEED_USERS = [
  {
    id: 1,
    nombre: "Supervisor Semielaborados",
    email: "se@empresa.com",
    passwordRaw: "Se123!",
    rol: "USER_SE",
  },
  {
    id: 2,
    nombre: "Supervisor Producto Terminado",
    email: "pt@empresa.com",
    passwordRaw: "Pt123!",
    rol: "USER_PT",
  },
  {
    id: 3,
    nombre: "Administrador General",
    email: "admin@empresa.com",
    passwordRaw: "Admin123!",
    rol: "ADMIN",
  },
];

export async function hashPassword(plainPassword) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
}

export async function comparePassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY);
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload;
  } catch {
    return null;
  }
}

export async function getServerSessionUser() {
  try {
    const nextHeaders = await import("next/headers");
    const cookieStore = await nextHeaders.cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifyToken(token);
  } catch {
    return null;
  }
}

export function getUserFromRequest(request) {
  try {
    const tokenCookie = request.cookies?.get(AUTH_COOKIE_NAME)?.value;
    const authHeader = request.headers?.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
    const token = tokenCookie || bearerToken;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}
