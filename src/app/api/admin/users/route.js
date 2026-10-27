import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import {
  listarUsuarios,
  actualizarRolUsuario,
  actualizarPermisoEdicionUsuario,
} from "@/lib/userRepository";

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

    const body = await request.json();
    const { id, rol, puedeEditar } = body;

    if (!id) {
      return NextResponse.json(
        { error: "El ID de usuario es obligatorio." },
        { status: 400 }
      );
    }

    let usuarioActualizado = null;

    // 1. Actualización de Permiso de Edición (Check en la interfaz de Administrador)
    if (puedeEditar !== undefined) {
      usuarioActualizado = await actualizarPermisoEdicionUsuario(id, Boolean(puedeEditar));
    }

    // 2. Actualización de Rol (Semi vs Terminado)
    if (rol !== undefined) {
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

      usuarioActualizado = await actualizarRolUsuario(id, rol);
    }

    return NextResponse.json({
      success: true,
      user: usuarioActualizado,
    });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    return NextResponse.json(
      { error: error.message || "Error al actualizar el usuario." },
      { status: 400 }
    );
  }
}
