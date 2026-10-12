import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET_STRING = process.env.JWT_SECRET || "super-secret-key-conciliacion-jwt-auth-2026-secure-token";
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET_STRING);
const AUTH_COOKIE_NAME = "auth_token";

async function verifyAuth(request) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Ignorar archivos estáticos, api auth y recursos internos
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const user = await verifyAuth(request);

  // Si intenta ir a /login
  if (pathname === "/login") {
    if (user) {
      if (user.rol === "USER_SE") {
        return NextResponse.redirect(new URL("/se", request.url));
      }
      return NextResponse.redirect(new URL("/pt", request.url));
    }
    return NextResponse.next();
  }

  // Raíz /
  if (pathname === "/") {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (user.rol === "USER_SE") {
      return NextResponse.redirect(new URL("/se", request.url));
    }
    return NextResponse.redirect(new URL("/pt", request.url));
  }

  // Rutas protegidas: requiere autenticación
  const isSeRoute = pathname.startsWith("/se");
  const isPtRoute = pathname.startsWith("/pt") || pathname.startsWith("/conciliaciones") || pathname.startsWith("/historial");

  if (!user && (isSeRoute || isPtRoute)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Control RBAC: USER_SE intentando entrar a PT
  if (isPtRoute && user?.rol === "USER_SE") {
    // Redirigir a /se con aviso
    const url = new URL("/se", request.url);
    url.searchParams.set("denied", "pt");
    return NextResponse.redirect(url);
  }

  // Control RBAC: USER_PT intentando entrar a SE
  if (isSeRoute && user?.rol === "USER_PT") {
    // Redirigir a consulta SE de PT /pt/se
    const url = new URL("/pt/se", request.url);
    url.searchParams.set("denied", "se_edit");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/se/:path*",
    "/pt/:path*",
    "/conciliaciones/:path*",
    "/historial/:path*",
  ],
};
