// src/app/(admin)/productos/page.tsx
import Link from 'next/link'; // Importar Link para el botón
import { ProductManagement } from './ProductManagement'; // Importa el componente de la tabla

// Metadata opcional para el título
export const metadata = {
  title: 'Gestión de Productos - Admin UnComercioMas',
};

export default function ProductosPage() {
  return (
    // Contenedor principal con padding
    <div className="p-4 md:p-8">

      {/* --- Encabezado y Botón --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b border-gray-200">
        {/* Título */}
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3 sm:mb-0">
          Productos
        </h1>
        {/* Botón de Alta */}
        <Link
          href="/productos/nuevo" // Enlace a la página del formulario de creación
          className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-md shadow-sm hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out text-sm"
        >
          {/* Icono Opcional (ej. Plus) */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Alta de Producto
        </Link>
      </div>
      {/* --- Fin Encabezado y Botón --- */}


      {/* --- Componente de Gestión (Tabla) --- */}
      {/* Este componente ahora solo necesita mostrar la tabla */}
      <ProductManagement />

    </div>
  );
}