"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import { useProduct } from '@/hooks/useProducts'; // Tu hook de Paso 1
import { Loader2, AlertTriangle } from 'lucide-react';
import { ProductEditForm } from './ProductEditForm'; // El formulario de abajo

export default function EditProductPage() {
  const params = useParams();
  const productId = params.id as string | undefined;

  // 1. Llama al hook para obtener los datos del producto
  const { data: product, isLoading, error } = useProduct(productId);

  // 2. Maneja el estado de carga
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2">Cargando producto...</span>
      </div>
    );
  }

  // 3. Maneja el estado de error
  if (error || !product) {
    return (
      <div className="flex flex-col items-center p-10 text-destructive border border-destructive/50 bg-destructive/10 rounded-lg">
        <AlertTriangle className="h-8 w-8 mb-2" />
        <strong>Error al cargar el producto</strong>
        <span>{error ? error.message : "Producto no encontrado."}</span>
      </div>
    );
  }

  // 4. Si todo está bien, renderiza el formulario con los datos
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">
        Editar Producto: <span className="font-normal text-muted-foreground">{product.nombre}</span>
      </h1>
      <ProductEditForm product={product} />
    </div>
  );
}