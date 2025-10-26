// src/app/(admin)/productos/[id]/page.tsx
"use client"; // Necesario para obtener params y usar hooks

import { useParams, useRouter } from 'next/navigation'; // Importar useRouter también
import { ProductForm } from '../ProductForm'; // Importa el form principal
import { VariantManager } from '../VariantManager'; // Importa el gestor de variantes
import { useProductById } from '@/hooks/useProducts'; // Hook para buscar por ID
import Link from 'next/link'; // Para botón de volver

// Metadata opcional (puede necesitar ser un Server Component para metadata estática)
// export const metadata = {
//   title: 'Editar Producto - Admin UnComercioMas',
// };

export default function EditarProductoPage() {
  const params = useParams();
  const router = useRouter(); // Para botón de volver
  // Asegurarse de que el ID es un string o null si no existe
  const productId = typeof params.id === 'string' ? params.id : null;

  // Usa el hook para obtener los datos del producto
  // Pasamos productId (que puede ser null inicialmente)
  const { data: productData, isLoading, error } = useProductById(productId);

  // --- Estados de Carga y Error ---
  if (!productId) {
    // Manejo si no hay ID en la URL (aunque la ruta debería prevenir esto)
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-xl font-semibold text-red-600 mb-4">Error</h2>
        <p className="text-gray-500 mb-4">No se proporcionó un ID de producto válido.</p>
        <Link href="/productos" className="text-blue-600 hover:underline">
          Volver a la lista de productos
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
       <div className="container mx-auto max-w-7xl px-4 py-8">
         {/* Skeleton Loader más completo */}
         <div className="animate-pulse">
           {/* Skeleton Header */}
           <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
             <div className="h-8 bg-gray-200 rounded w-1/2"></div>
             <div className="h-4 bg-gray-200 rounded w-24"></div>
           </div>
           {/* Skeleton Grid */}
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             {/* Skeleton Form */}
             <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md space-y-6">
               {[...Array(6)].map((_, i) => ( // Ajusta el número de placeholders
                 <div key={i}>
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-10 bg-gray-200 rounded w-full"></div>
                 </div>
               ))}
                <div className="flex justify-end gap-3 pt-6 border-t mt-8">
                    <div className="h-10 bg-gray-200 rounded w-24"></div>
                    <div className="h-10 bg-gray-200 rounded w-32"></div>
                </div>
             </div>
             {/* Skeleton Variants */}
             <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-200 rounded w-28"></div>
                </div>
                <div className="h-40 bg-gray-100 border rounded"></div>
             </div>
           </div>
         </div>
       </div>
    );
  }

  if (error) {
    return (
       <div className="container mx-auto px-4 py-8 text-center">
         <h2 className="text-xl font-semibold text-red-600 mb-4">Error al Cargar Producto</h2>
         <p className="text-red-500 mb-4">{error.message}</p>
         <Link href="/productos" className="text-blue-600 hover:underline">
           Volver a la lista de productos
         </Link>
       </div>
      );
  }

  if (!productData) {
     // Esto podría pasar si el ID es válido pero el producto no se encuentra (404 de la API)
     return (
       <div className="container mx-auto px-4 py-8 text-center">
         <h2 className="text-xl font-semibold text-yellow-600 mb-4">Producto no Encontrado</h2>
         <p className="text-gray-500 mb-4">No se pudo encontrar un producto con el ID proporcionado.</p>
          <Link href="/productos" className="text-blue-600 hover:underline">
           Volver a la lista de productos
         </Link>
       </div>
     );
  }

  // --- Renderizado Principal (Layout de 2 Columnas) ---
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8"> {/* Limita el ancho máximo */}
       {/* Encabezado */}
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-gray-200 pb-4 gap-4">
         <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex-shrink-0">
           Editar Producto: <span className="font-medium text-indigo-600">{productData.nombre}</span>
         </h1>
         <Link href="/productos" className="text-blue-600 hover:underline text-sm font-medium whitespace-nowrap">
           &larr; Volver a la lista de productos
         </Link>
       </div>

       {/* Grid Layout */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start"> {/* items-start para alinear arriba */}

         {/* Columna Izquierda (Formulario Principal) */}
         <div className="lg:col-span-2">
            <ProductForm initialData={productData} />
         </div>

         {/* Columna Derecha (Gestor de Variantes) */}
         <div className="lg:col-span-1 lg:sticky lg:top-8"> {/* Sticky opcional para que se quede fijo al hacer scroll */}
            <VariantManager productId={productId} />
         </div>

       </div>
    </div>
  );
}