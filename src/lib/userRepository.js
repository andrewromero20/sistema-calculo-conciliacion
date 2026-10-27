import { prisma } from "./prisma.js";
import { SEED_USERS, hashPassword, comparePassword } from "./auth.js";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FALLBACK_FILE = path.join(DATA_DIR, "users-storage.json");

let isPrismaOffline = false;
let lastPrismaCheck = 0;
const PRISMA_OFFLINE_COOLDOWN = 60000;

function isPrismaAvailable() {
  if (isPrismaOffline && Date.now() - lastPrismaCheck < PRISMA_OFFLINE_COOLDOWN) {
    return false;
  }
  return true;
}

function markPrismaOffline(err) {
  isPrismaOffline = true;
  lastPrismaCheck = Date.now();
  console.warn("Prisma no disponible para usuarios (usando fallback JSON):", err?.message || err);
}

function markPrismaOnline() {
  isPrismaOffline = false;
}

function ensureUsersFallbackFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(USERS_FALLBACK_FILE)) {
      const initialUsers = SEED_USERS.map((u) => ({
        id: u.id,
        nombre: u.nombre,
        email: u.email,
        password: u.passwordRaw,
        rol: u.rol,
        fechaCreacion: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
      }));
      fs.writeFileSync(USERS_FALLBACK_FILE, JSON.stringify(initialUsers, null, 2), "utf8");
    }
  } catch (err) {
    console.error("Error al inicializar users fallback storage:", err);
  }
}

function readUsersFallback() {
  ensureUsersFallbackFile();
  try {
    const raw = fs.readFileSync(USERS_FALLBACK_FILE, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error al leer users fallback storage:", err);
    return SEED_USERS.map((u) => ({
      id: u.id,
      nombre: u.nombre,
      email: u.email,
      password: u.passwordRaw,
      rol: u.rol,
      fechaCreacion: new Date().toISOString(),
    }));
  }
}

function writeUsersFallback(users) {
  ensureUsersFallbackFile();
  try {
    fs.writeFileSync(USERS_FALLBACK_FILE, JSON.stringify(users, null, 2), "utf8");
  } catch (err) {
    console.error("Error al escribir users fallback storage:", err);
  }
}

export async function listarUsuarios() {
  if (isPrismaAvailable()) {
    try {
      const usuarios = await prisma.usuario.findMany({
        select: {
          id: true,
          nombre: true,
          email: true,
          rol: true,
          fechaCreacion: true,
        },
        orderBy: { id: "asc" },
      });
      if (usuarios && usuarios.length > 0) {
        markPrismaOnline();
        return usuarios;
      }
    } catch (err) {
      markPrismaOffline(err);
    }
  }

  // Fallback local
  const users = readUsersFallback();
  return users.map((u) => ({
    id: u.id,
    nombre: u.nombre,
    email: u.email,
    rol: u.rol,
    puedeEditar: Boolean(u.puedeEditar),
    fechaCreacion: u.fechaCreacion || new Date().toISOString(),
  }));
}

export async function actualizarRolUsuario(id, nuevoRol) {
  const validRoles = ["USER_SE", "USER_PT", "ADMIN"];
  if (!validRoles.includes(nuevoRol)) {
    throw new Error(`Rol inválido: ${nuevoRol}. Roles permitidos: USER_SE, USER_PT, ADMIN`);
  }

  const numericId = Number(id);
  let updatedUser = null;

  if (isPrismaAvailable()) {
    try {
      updatedUser = await prisma.usuario.update({
        where: { id: numericId },
        data: { rol: nuevoRol },
        select: {
          id: true,
          nombre: true,
          email: true,
          rol: true,
          fechaCreacion: true,
        },
      });
      markPrismaOnline();
    } catch (err) {
      markPrismaOffline(err);
    }
  }

  // Actualizar también en el almacenamiento local fallback
  const users = readUsersFallback();
  const index = users.findIndex((u) => Number(u.id) === numericId);
  if (index !== -1) {
    users[index].rol = nuevoRol;
    // Si deja de pertenecer a Semielaborados, se revoca el permiso de edición
    if (nuevoRol !== "USER_SE") {
      users[index].puedeEditar = false;
    }
    writeUsersFallback(users);
    if (!updatedUser) {
      updatedUser = {
        id: users[index].id,
        nombre: users[index].nombre,
        email: users[index].email,
        rol: users[index].rol,
        puedeEditar: Boolean(users[index].puedeEditar),
        fechaCreacion: users[index].fechaCreacion,
      };
    }
  }

  // Sincronizar memoria en SEED_USERS
  const seed = SEED_USERS.find((u) => Number(u.id) === numericId);
  if (seed) {
    seed.rol = nuevoRol;
    if (nuevoRol !== "USER_SE") {
      seed.puedeEditar = false;
    }
  }

  if (!updatedUser) {
    throw new Error(`Usuario con ID ${id} no encontrado.`);
  }

  return updatedUser;
}

export async function actualizarPermisoEdicionUsuario(id, puedeEditar) {
  const numericId = Number(id);
  const users = readUsersFallback();
  const index = users.findIndex((u) => Number(u.id) === numericId);
  if (index === -1) {
    throw new Error(`Usuario con ID ${id} no encontrado.`);
  }

  // Solo los usuarios pertenecientes al Semielaborado (USER_SE) pueden tener habilitado el permiso
  if (users[index].rol !== "USER_SE" && puedeEditar) {
    throw new Error("El permiso de edición únicamente puede habilitarse para usuarios de Semielaborado (Semi).");
  }

  users[index].puedeEditar = Boolean(puedeEditar);
  writeUsersFallback(users);

  // Sincronizar en memoria en SEED_USERS
  const seed = SEED_USERS.find((u) => Number(u.id) === numericId);
  if (seed) {
    seed.puedeEditar = Boolean(puedeEditar);
  }

  return {
    id: users[index].id,
    nombre: users[index].nombre,
    email: users[index].email,
    rol: users[index].rol,
    puedeEditar: Boolean(users[index].puedeEditar),
  };
}

export async function buscarUsuarioPorEmail(email) {
  const cleanEmail = String(email || "").trim().toLowerCase();

  if (isPrismaAvailable()) {
    try {
      const usuario = await prisma.usuario.findUnique({
        where: { email: cleanEmail },
      });
      if (usuario) {
        markPrismaOnline();
        return usuario;
      }
    } catch (err) {
      markPrismaOffline(err);
    }
  }

  // Fallback local desde users-storage.json o SEED_USERS
  const users = readUsersFallback();
  const found = users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (found) {
    return {
      id: found.id,
      nombre: found.nombre,
      email: found.email,
      password: found.password,
      rol: found.rol,
      puedeEditar: Boolean(found.puedeEditar),
      fechaCreacion: found.fechaCreacion,
    };
  }

  const seed = SEED_USERS.find((u) => u.email.toLowerCase() === cleanEmail);
  if (!seed) return null;

  return {
    id: seed.id,
    nombre: seed.nombre,
    email: seed.email,
    password: seed.passwordRaw,
    rol: seed.rol,
    puedeEditar: Boolean(seed.puedeEditar),
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

  if (usuario.password === plainPassword) {
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
