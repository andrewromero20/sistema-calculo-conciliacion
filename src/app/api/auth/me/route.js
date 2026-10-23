import { NextResponse } from "next/server";
import { getServerSessionUser, signToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { buscarUsuarioPorEmail } from "@/lib/userRepository";

export async function GET() {
  const sessionUser = await getServerSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  // Buscar el usuario en el repositorio para reflejar cambios de rol en tiempo real
  const dbUser = await buscarUsuarioPorEmail(sessionUser.email);
  const user = dbUser
    ? {
        id: dbUser.id,
        nombre: dbUser.nombre,
        email: dbUser.email,
        rol: dbUser.rol,
      }
    : sessionUser;

  const response = NextResponse.json({ authenticated: true, user });

  // Si el rol fue modificado por el administrador, renovar la cookie automáticamente
  if (dbUser && dbUser.rol !== sessionUser.rol) {
    const freshToken = await signToken(user);
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: freshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  return response;
}
