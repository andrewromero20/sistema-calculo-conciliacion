import { NextResponse } from "next/server";
import { inicializarUsuariosSeedEnBD } from "@/lib/userRepository";
import { SEED_USERS } from "@/lib/auth";

export async function POST() {
  await inicializarUsuariosSeedEnBD();
  return NextResponse.json({
    success: true,
    message: "Usuarios inicializados.",
    usuariosDisponibles: SEED_USERS.map((u) => ({
      email: u.email,
      rol: u.rol,
      password: u.passwordRaw,
      nombre: u.nombre,
    })),
  });
}
