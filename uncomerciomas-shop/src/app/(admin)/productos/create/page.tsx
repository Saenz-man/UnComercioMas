"use client";
// Hacemos esta página "use client" porque ProductForm usa hooks.
// Los datos (categorías, etc.) se cargarán en el cliente.

import { ProductForm } from "../components/ProductForm";

export default function CreateProductPage() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      {/* Renderizamos el formulario.
        Como NO pasamos 'initialData', automáticamente
        estará en modo "Crear".
      */}
      <ProductForm />
    </div>
  );
}