import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    // Esto permite que los console.log se mantengan en el build de producción
    // para facilitar la depuración.
    removeConsole: false,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        // El puerto de tu API
        port: '3000', 
        // La ruta donde se sirven las imágenes
        pathname: '/uploads/**', 
      },
    ],
  },
};

export default nextConfig;
