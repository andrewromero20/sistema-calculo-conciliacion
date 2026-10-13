import { prisma } from "./prisma.js";
import { Prisma } from "@prisma/client";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const FALLBACK_FILE = path.join(DATA_DIR, "se-storage.json");

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
  console.warn("Prisma/PostgreSQL no disponible (usando fallback local JSON):", err?.message || err);
}

function markPrismaOnline() {
  isPrismaOffline = false;
}

function ensureFallbackFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(FALLBACK_FILE)) {
      const initialData = {
        registros: [
          {
            ordenGranel: "OG-900142",
            lote: "L-2601",
            codigoMaterial: "MAT-TAB-500",
            producto: "Paracetamol 500mg Granel Tableteado",
            tamanoLoteEstandar: 250.0,
            supervisorPreparacion: "Ing. Roberto Domínguez",
            supervisorTabRecub: "Ing. Laura Méndez",
            pesoNetoTotalTabletas: 248.5,
            pesoPromedio: 0.52,
            cantPzasCargarSap: 477884,
            cantPzasAcondicionar: 475000,
            muestrasTabRecub: 500,
            rendimientoTab: 99.4,
            ctecGranelSap: "CTEC-GR-0142",
            fechaInicioTableteado: new Date(Date.now() - 3600000 * 48).toISOString(),
            fechaFinTableteado: new Date(Date.now() - 3600000 * 36).toISOString(),
            fechaInicioRecubrimiento: new Date(Date.now() - 3600000 * 30).toISOString(),
            fechaFinPrimeraCarga: new Date(Date.now() - 3600000 * 20).toISOString(),
            fechaFinRecubrimiento: new Date(Date.now() - 3600000 * 12).toISOString(),
            creadoPorId: 1,
            fechaCreacion: new Date(Date.now() - 3600000 * 50).toISOString(),
            fechaActualizacion: new Date(Date.now() - 3600000 * 50).toISOString(),
            pesos: [
              { id: 1, registroSeOrden: "OG-900142", pesoBruto: 52.4, pesoTara: 2.1, pesoNeto: 50.3 },
              { id: 2, registroSeOrden: "OG-900142", pesoBruto: 51.9, pesoTara: 2.1, pesoNeto: 49.8 },
              { id: 3, registroSeOrden: "OG-900142", pesoBruto: 51.5, pesoTara: 2.1, pesoNeto: 49.4 },
              { id: 4, registroSeOrden: "OG-900142", pesoBruto: 51.7, pesoTara: 2.1, pesoNeto: 49.6 },
              { id: 5, registroSeOrden: "OG-900142", pesoBruto: 51.5, pesoTara: 2.1, pesoNeto: 49.4 },
            ],
            auditorias: [],
          },
        ],
      };
      fs.writeFileSync(FALLBACK_FILE, JSON.stringify(initialData, null, 2), "utf8");
    }
  } catch (err) {
    console.error("Error al inicializar fallback storage:", err);
  }
}

function readFallback() {
  ensureFallbackFile();
  try {
    const raw = fs.readFileSync(FALLBACK_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return { registros: [] };
  }
}

function writeFallback(data) {
  ensureFallbackFile();
  try {
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Error al escribir fallback storage:", err);
  }
}

export function calcularDiffSE(viejo, nuevo) {
  const campos = [
    "lote",
    "codigoMaterial",
    "producto",
    "tamanoLoteEstandar",
    "supervisorPreparacion",
    "supervisorTabRecub",
    "pesoNetoTotalTabletas",
    "pesoPromedio",
    "cantTabPorPza",
    "cantPzasCargarSap",
    "cantPzasAcondicionar",
    "muestrasTabRecub",
    "rendimientoTab",
    "ctecGranelSap",
    "fechaInicioTableteado",
    "fechaFinTableteado",
    "fechaInicioRecubrimiento",
    "fechaFinPrimeraCarga",
    "fechaFinRecubrimiento",
  ];

  const diff = {};

  for (const campo of campos) {
    let valA = viejo[campo];
    let valB = nuevo[campo];

    if (valA instanceof Date) valA = valA.toISOString();
    if (valB instanceof Date) valB = valB.toISOString();
    if (typeof valA === "object" && valA?.toNumber) valA = valA.toNumber();
    if (typeof valB === "object" && valB?.toNumber) valB = valB.toNumber();

    if (typeof valA === "number" || typeof valB === "number") {
      const numA = Number(valA);
      const numB = Number(valB);
      if (Math.abs(numA - numB) > 0.00001) {
        diff[campo] = { anterior: numA, nuevo: numB };
      }
    } else if (String(valA || "").trim() !== String(valB || "").trim()) {
      diff[campo] = { anterior: valA ?? null, nuevo: valB ?? null };
    }
  }

  // Comparar pesadas
  const pesosViejos = viejo.pesos || [];
  const pesosNuevos = nuevo.pesos || [];
  if (pesosViejos.length !== pesosNuevos.length) {
    diff.pesadas_cantidad = {
      anterior: pesosViejos.length,
      nuevo: pesosNuevos.length,
    };
  }

  const sumaV = pesosViejos.reduce((s, p) => s + Number(p.pesoNeto || 0), 0);
  const sumaN = pesosNuevos.reduce((s, p) => s + Number(p.pesoNeto || 0), 0);
  if (Math.abs(sumaV - sumaN) > 0.0001) {
    diff.pesadas_suma_neto = {
      anterior: Number(sumaV.toFixed(4)),
      nuevo: Number(sumaN.toFixed(4)),
    };
  }

  return diff;
}

export async function obtenerTodosRegistrosSE() {
  if (!isPrismaAvailable()) {
    const fb = readFallback();
    return fb.registros || [];
  }

  try {
    const list = await prisma.registroSE.findMany({
      include: {
        pesos: { orderBy: { id: "asc" } },
        auditorias: {
          orderBy: { fechaModificacion: "desc" },
          include: { usuario: { select: { id: true, nombre: true, email: true, rol: true } } },
        },
        creadoPor: { select: { id: true, nombre: true, email: true } },
      },
      orderBy: { fechaCreacion: "desc" },
    });
    markPrismaOnline();
    return list;
  } catch (err) {
    markPrismaOffline(err);
    const fb = readFallback();
    return fb.registros || [];
  }
}

export async function obtenerRegistroSEPorOrden(ordenGranel) {
  const og = String(ordenGranel || "").trim();
  if (isPrismaAvailable()) {
    try {
      const registro = await prisma.registroSE.findUnique({
        where: { ordenGranel: og },
        include: {
          pesos: { orderBy: { id: "asc" } },
          auditorias: {
            orderBy: { fechaModificacion: "desc" },
            include: { usuario: { select: { id: true, nombre: true, email: true, rol: true } } },
          },
          creadoPor: { select: { id: true, nombre: true, email: true } },
        },
      });
      if (registro) {
        markPrismaOnline();
        return registro;
      }
    } catch (err) {
      markPrismaOffline(err);
    }
  }

  const fb = readFallback();
  return (fb.registros || []).find((r) => r.ordenGranel === og) || null;
}

export async function crearRegistroSE(datos, usuarioId) {
  const {
    ordenGranel,
    lote,
    codigoMaterial,
    producto,
    tamanoLoteEstandar,
    supervisorPreparacion,
    supervisorTabRecub,
    pesoNetoTotalTabletas,
    pesoPromedio,
    cantPzasCargarSap,
    cantPzasAcondicionar,
    muestrasTabRecub,
    rendimientoTab,
    ctecGranelSap,
    fechaInicioTableteado,
    fechaFinTableteado,
    fechaInicioRecubrimiento,
    fechaFinPrimeraCarga,
    fechaFinRecubrimiento,
    pesos,
  } = datos;

  try {
    // Transacción atómica de Prisma
    const resultado = await prisma.$transaction(async (tx) => {
      // Verificar unicidad
      const existente = await tx.registroSE.findUnique({
        where: { ordenGranel },
      });
      if (existente) {
        throw new Error(`La Orden a Granel ${ordenGranel} ya se encuentra registrada.`);
      }

      const loteExistente = await tx.registroSE.findUnique({
        where: { lote },
      });
      if (loteExistente) {
        throw new Error(`El número de lote ${lote} ya está asignado a otra orden.`);
      }

      // Asegurar existencia del usuario si está en base de datos
      const userExists = await tx.usuario.findUnique({ where: { id: usuarioId } });
      const finalUserId = userExists ? usuarioId : (await tx.usuario.findFirst())?.id || 1;

      const nuevoRegistro = await tx.registroSE.create({
        data: {
          ordenGranel,
          lote,
          codigoMaterial,
          producto,
          tamanoLoteEstandar: new Prisma.Decimal(tamanoLoteEstandar),
          supervisorPreparacion,
          supervisorTabRecub,
          pesoNetoTotalTabletas: new Prisma.Decimal(pesoNetoTotalTabletas),
          pesoPromedio: new Prisma.Decimal(pesoPromedio),
          cantPzasCargarSap: new Prisma.Decimal(cantPzasCargarSap),
          cantPzasAcondicionar: new Prisma.Decimal(cantPzasAcondicionar),
          muestrasTabRecub: new Prisma.Decimal(muestrasTabRecub),
          rendimientoTab: new Prisma.Decimal(rendimientoTab),
          ctecGranelSap,
          fechaInicioTableteado: new Date(fechaInicioTableteado),
          fechaFinTableteado: new Date(fechaFinTableteado),
          fechaInicioRecubrimiento: new Date(fechaInicioRecubrimiento),
          fechaFinPrimeraCarga: new Date(fechaFinPrimeraCarga),
          fechaFinRecubrimiento: new Date(fechaFinRecubrimiento),
          creadoPorId: finalUserId,
          pesos: {
            create: pesos.map((p) => ({
              pesoBruto: new Prisma.Decimal(p.pesoBruto),
              pesoTara: new Prisma.Decimal(p.pesoTara),
              pesoNeto: new Prisma.Decimal(p.pesoNeto),
            })),
          },
        },
        include: {
          pesos: { orderBy: { id: "asc" } },
          creadoPor: { select: { id: true, nombre: true, email: true } },
          auditorias: true,
        },
      });

      return nuevoRegistro;
    });

    return resultado;
  } catch (err) {
    if (err.message && (err.message.includes("ya se encuentra") || err.message.includes("ya está asignado"))) {
      throw err;
    }

    markPrismaOffline(err);
    const fb = readFallback();
    if (fb.registros.some((r) => r.ordenGranel === ordenGranel)) {
      throw new Error(`La Orden a Granel ${ordenGranel} ya se encuentra registrada.`);
    }
    if (fb.registros.some((r) => r.lote === lote)) {
      throw new Error(`El número de lote ${lote} ya está asignado a otra orden.`);
    }

    const nuevo = {
      ordenGranel,
      lote,
      codigoMaterial,
      producto,
      tamanoLoteEstandar: Number(tamanoLoteEstandar),
      supervisorPreparacion,
      supervisorTabRecub,
      pesoNetoTotalTabletas: Number(pesoNetoTotalTabletas),
      pesoPromedio: Number(pesoPromedio),
      cantPzasCargarSap: Number(cantPzasCargarSap),
      cantPzasAcondicionar: Number(cantPzasAcondicionar),
      muestrasTabRecub: Number(muestrasTabRecub),
      rendimientoTab: Number(rendimientoTab),
      ctecGranelSap,
      fechaInicioTableteado: new Date(fechaInicioTableteado).toISOString(),
      fechaFinTableteado: new Date(fechaFinTableteado).toISOString(),
      fechaInicioRecubrimiento: new Date(fechaInicioRecubrimiento).toISOString(),
      fechaFinPrimeraCarga: new Date(fechaFinPrimeraCarga).toISOString(),
      fechaFinRecubrimiento: new Date(fechaFinRecubrimiento).toISOString(),
      creadoPorId: usuarioId || 1,
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString(),
      pesos: pesos.map((p, idx) => ({
        id: idx + 1,
        registroSeOrden: ordenGranel,
        pesoBruto: Number(p.pesoBruto),
        pesoTara: Number(p.pesoTara),
        pesoNeto: Number(p.pesoNeto),
      })),
      auditorias: [],
    };

    fb.registros.unshift(nuevo);
    writeFallback(fb);
    return nuevo;
  }
}

export async function actualizarRegistroSE(ordenGranel, datosNuevos, usuarioId, justificacion) {
  const registroActual = await obtenerRegistroSEPorOrden(ordenGranel);
  if (!registroActual) {
    throw new Error(`No se encontró el registro con Orden Granel ${ordenGranel}`);
  }

  const diff = calcularDiffSE(registroActual, datosNuevos);

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Eliminar pesadas anteriores
      await tx.pesoSE.deleteMany({
        where: { registroSeOrden: ordenGranel },
      });

      // 2. Actualizar datos de cabecera
      const actualizado = await tx.registroSE.update({
        where: { ordenGranel },
        data: {
          lote: datosNuevos.lote,
          codigoMaterial: datosNuevos.codigoMaterial,
          producto: datosNuevos.producto,
          tamanoLoteEstandar: new Prisma.Decimal(datosNuevos.tamanoLoteEstandar),
          supervisorPreparacion: datosNuevos.supervisorPreparacion,
          supervisorTabRecub: datosNuevos.supervisorTabRecub,
          pesoNetoTotalTabletas: new Prisma.Decimal(datosNuevos.pesoNetoTotalTabletas),
          pesoPromedio: new Prisma.Decimal(datosNuevos.pesoPromedio),
          cantPzasCargarSap: new Prisma.Decimal(datosNuevos.cantPzasCargarSap),
          cantPzasAcondicionar: new Prisma.Decimal(datosNuevos.cantPzasAcondicionar),
          muestrasTabRecub: new Prisma.Decimal(datosNuevos.muestrasTabRecub),
          rendimientoTab: new Prisma.Decimal(datosNuevos.rendimientoTab),
          ctecGranelSap: datosNuevos.ctecGranelSap,
          fechaInicioTableteado: new Date(datosNuevos.fechaInicioTableteado),
          fechaFinTableteado: new Date(datosNuevos.fechaFinTableteado),
          fechaInicioRecubrimiento: new Date(datosNuevos.fechaInicioRecubrimiento),
          fechaFinPrimeraCarga: new Date(datosNuevos.fechaFinPrimeraCarga),
          fechaFinRecubrimiento: new Date(datosNuevos.fechaFinRecubrimiento),
          pesos: {
            create: (datosNuevos.pesos || []).map((p) => ({
              pesoBruto: new Prisma.Decimal(p.pesoBruto),
              pesoTara: new Prisma.Decimal(p.pesoTara),
              pesoNeto: new Prisma.Decimal(p.pesoNeto),
            })),
          },
        },
        include: {
          pesos: { orderBy: { id: "asc" } },
        },
      });

      // 3. Registrar auditoría con diferencias
      const userExists = await tx.usuario.findUnique({ where: { id: usuarioId } });
      const finalUserId = userExists ? usuarioId : (await tx.usuario.findFirst())?.id || 1;

      await tx.auditoriaSE.create({
        data: {
          registroSeOrden: ordenGranel,
          usuarioId: finalUserId,
          cambios: diff,
          justificacion: justificacion.trim(),
        },
      });

      return await tx.registroSE.findUnique({
        where: { ordenGranel },
        include: {
          pesos: { orderBy: { id: "asc" } },
          auditorias: {
            orderBy: { fechaModificacion: "desc" },
            include: { usuario: { select: { id: true, nombre: true, email: true, rol: true } } },
          },
          creadoPor: { select: { id: true, nombre: true, email: true } },
        },
      });
    });

    return { registro: resultado, diff };
  } catch (err) {
    markPrismaOffline(err);
    const fb = readFallback();
    const idx = fb.registros.findIndex((r) => r.ordenGranel === ordenGranel);
    if (idx === -1) {
      throw new Error(`Registro ${ordenGranel} no encontrado.`);
    }

    const nuevaAuditoria = {
      id: (fb.registros[idx].auditorias?.length || 0) + 1,
      registroSeOrden: ordenGranel,
      usuarioId: usuarioId || 1,
      fechaModificacion: new Date().toISOString(),
      cambios: diff,
      justificacion: justificacion.trim(),
      usuario: { id: usuarioId || 1, nombre: "Usuario Actual", email: "usuario@empresa.com" },
    };

    const actualizado = {
      ...fb.registros[idx],
      ...datosNuevos,
      tamanoLoteEstandar: Number(datosNuevos.tamanoLoteEstandar),
      pesoNetoTotalTabletas: Number(datosNuevos.pesoNetoTotalTabletas),
      pesoPromedio: Number(datosNuevos.pesoPromedio),
      cantPzasCargarSap: Number(datosNuevos.cantPzasCargarSap),
      cantPzasAcondicionar: Number(datosNuevos.cantPzasAcondicionar),
      muestrasTabRecub: Number(datosNuevos.muestrasTabRecub),
      rendimientoTab: Number(datosNuevos.rendimientoTab),
      fechaActualizacion: new Date().toISOString(),
      pesos: (datosNuevos.pesos || []).map((p, pIdx) => ({
        id: pIdx + 1,
        registroSeOrden: ordenGranel,
        pesoBruto: Number(p.pesoBruto),
        pesoTara: Number(p.pesoTara),
        pesoNeto: Number(p.pesoNeto),
      })),
      auditorias: [nuevaAuditoria, ...(fb.registros[idx].auditorias || [])],
    };

    fb.registros[idx] = actualizado;
    writeFallback(fb);
    return { registro: actualizado, diff };
  }
}
