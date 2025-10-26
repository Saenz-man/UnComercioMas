// src/components/admin/products/ProductManagement.tsx
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useProducts, useDeleteProduct } from '@/hooks/useProducts';
import type { Product } from '@/types/product.types';

export function ProductManagement() {
  const { data: products = [], isLoading, error } = useProducts();
  const deleteProductMutation = useDeleteProduct();

  // --- Manejo de Carga y Errores ---
  if (isLoading) {
    return ( // Skeleton Loader más completo
      <div className="bg-white p-4 rounded-lg shadow-md animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => ( // Muestra 3 filas de skeleton
            <div key={i} className="flex space-x-4 items-center border-b pb-3">
              <div className="h-10 w-10 bg-gray-200 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-1/6"></div>
              <div className="h-4 bg-gray-200 rounded w-1/6"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (error) {
    return ( // Mensaje de error más detallado
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline ml-2">Error al cargar productos: {error.message}</span>
      </div>
    );
  }

  // --- Añadir Log para Verificar Datos en Render ---
  console.log("[ProductManagement] Datos recibidos para render:", products);

  const handleDelete = (id: string, name: string) => {
     if (window.confirm(`¿Estás seguro de que quieres eliminar el producto "${name}" y todas sus variantes?`)) {
        deleteProductMutation.mutate(id, {
           onSuccess: () => alert('Producto eliminado con éxito.'),
           onError: (err: any) => alert(`Error al eliminar: ${err.response?.data?.message || err.message}`)
        });
     }
  };
  const isMutating = deleteProductMutation.isPending;

  return (
    <div>
      {/* Tabla de Productos */}
      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
         {/* Quitamos el h2 sr-only, el título ya está en la página */}
         {products.length > 0 ? (
           <table className="min-w-full divide-y divide-gray-200">
             {/* --- ENCABEZADO DE TABLA COMPLETO --- */}
             <thead className="bg-gray-50">
               <tr>
                 <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Imagen</th>
                 <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                 <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                 <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Base</th>
                 <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
               </tr>
             </thead>
             {/* --- CUERPO DE TABLA COMPLETO Y SEGURO --- */}
             <tbody className="bg-white divide-y divide-gray-200">
               {products.map((product) => (
                 <tr key={product.id} className="hover:bg-gray-50 transition duration-150 ease-in-out">
                    {/* Celda Imagen (con fallback) */}
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                       {(product.fotos && product.fotos.length > 0 && product.fotos[0]) ? (
                         <img src={product.fotos[0]} alt={product.nombre || 'Producto'} className="h-10 w-10 object-cover rounded shadow" />
                       ) : (
                         <div className="h-10 w-10 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400 border">Sin foto</div>
                       )}
                   </td>
                   {/* Celda Nombre */}
                   <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.nombre || 'Nombre no disponible'}</td>
                   {/* Celda Categoría (con verificación) */}
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.categoria?.nombre || <span className="text-gray-400 italic">Sin categoría</span>}</td>
                   {/* Celda Precio (con verificación y formato) */}
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                       {product.precio_base != null ? `$${Number(product.precio_base).toFixed(2)}` : <span className="text-gray-400 italic">N/A</span>}
                    </td>
                   {/* Celda Acciones */}
                   <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                     <Link
                        href={`/productos/${product.id}`}
                        className="text-indigo-600 hover:text-indigo-900 hover:underline focus:outline-none"
                        title="Editar"
                     >
                       Editar
                     </Link>
                     <button
                        onClick={() => handleDelete(product.id, product.nombre)}
                        className="text-red-600 hover:text-red-900 hover:underline focus:outline-none"
                        title="Eliminar"
                        disabled={isMutating}
                     >
                       Eliminar
                     </button>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         ) : (
           <p className="text-gray-500 italic text-center py-6 px-4">No hay productos creados todavía.</p>
         )}
      </div>
      {/* --- Fin Tabla --- */}
    </div>
  );
}