import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { listarUsuarios, actualizarRolUsuario } from "@/lib/userRepository";

export async function GET() {
  try {
    const session = await getServerSessionUser();
    if (!session || session.rol !== "ADMIN") {
      return NextResponse.json(
        { error: "Acceso denegado. Se requieren permisos de Administrador." },
        { status: 403 }
      );
    }

    const usuarios = await listarUsuarios();
    return NextResponse.json(usuarios);
  } catch (error) {
    console.error("Error al listar usuarios:", error);
    return NextResponse.json(
      { error: "Error al consultar los usuarios registrados." },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const session = await getServerSessionUser();
    if (!session || session.rol !== "ADMIN") {
      return NextResponse.json(
        { error: "Acceso denegado. Se requieren permisos de Administrador." },
        { status: 403 }
      );
    }

    const { id, rol } = await request.json();

    if (!id || !rol) {
      return NextResponse.json(
        { error: "ID de usuario y nuevo rol son obligatorios." },
        { status: 400 }
      );
    }

    // El usuario especificó: "puede cambiar sus roles los cuales son justamente Semi y Terminado"
    if (rol !== "USER_SE" && rol !== "USER_PT") {
      return NextResponse.json(
        { error: "El rol asignado debe ser Semielaborado (USER_SE) o Producto Terminado (USER_PT)." },
        { status: 400 }
      );
    }

    // Evitar que el administrador se cambie a sí mismo y quede sin acceso
    if (Number(session.id) === Number(id)) {
      return NextResponse.json(
        { error: "No es posible modificar el rol de tu propia cuenta de Administrador." },
        { status: 400 }
      );
    }

    const usuarioActualizado = await actualizarRolUsuario(id, rol);

    return NextResponse.json({
      success: true,
      user: usuarioActualizado,
    });
  } catch (error) {
    console.error("Error al actualizar rol de usuario:", error);
    return NextResponse.json(
      { error: error.message || "Error al actualizar el rol del usuario." },
      { status: 500 }
    );
  }
}
