/** @type {import('next').NextConfig} */
const nextConfig = {
  // Permitir acceso desde la red local (LAN) en desarrollo (Next.js 15/16)
  // para que los scripts e hidratación de React se carguen sin ser bloqueados por origen cruzado
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "192.168.*.*",
    "10.*.*.*",
    "172.*.*.*",
  ],
};

export default nextConfig;
