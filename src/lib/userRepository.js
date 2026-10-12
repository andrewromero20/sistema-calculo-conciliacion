import { prisma } from "./prisma.js";
import { SEED_USERS, hashPassword, comparePassword } from "./auth.js";

export async function buscarUsuarioPorEmail(email) {
  const cleanEmail = String(email || "").trim().toLowerCase();

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { email: cleanEmail },
    });
    if (usuario) return usuario;
  } catch (err) {
    console.warn("Prisma no disponible para buscarUsuarioPorEmail:", err.message);
  }

  // Fallback a SEED_USERS
  const seed = SEED_USERS.find((u) => u.email.toLowerCase() === cleanEmail);
  if (!seed) return null;

  return {
    id: seed.id,
    nombre: seed.nombre,
    email: seed.email,
    password: seed.passwordRaw, // en fallback verificaremos tanto con hash como con texto plano
    rol: seed.rol,
  };
}

export async function validarCredenciales(email, plainPassword) {
  const usuario = await buscarUsuarioPorEmail(email);
  if (!usuario) return null;

  // Si tiene password hasheado con bcrypt
  if (usuario.password && usuario.password.startsWith("$2")) {
    const match = await comparePassword(plainPassword, usuario.password);
    if (match) return usuario;
  }

  // Si coincide directamente con el password inicial de semilla
  const seed = SEED_USERS.find((u) => u.email.toLowerCase() === usuario.email.toLowerCase());
  if (seed && seed.passwordRaw === plainPassword) {
    return usuario;
  }

  return null;
}

export async function inicializarUsuariosSeedEnBD() {
  try {
    for (const seed of SEED_USERS) {
      const existe = await prisma.usuario.findUnique({ where: { email: seed.email } });
      if (!existe) {
        const hashedPassword = await hashPassword(seed.passwordRaw);
        await prisma.usuario.create({
          data: {
            nombre: seed.nombre,
            email: seed.email,
            password: hashedPassword,
            rol: seed.rol,
          },
        });
      }
    }
  } catch (err) {
    console.warn("No se pudieron sembrar usuarios en Prisma:", err.message);
  }
}
