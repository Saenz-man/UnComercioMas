// src/app/(admin)/productos/nuevo/page.tsx
import { ProductForm } from '../ProductForm'; // Importaremos el formulario

// Metadata opcional para el título de la página
export const metadata = {
  title: 'Crear Nuevo Producto - Admin UnComercioMas',
};

export default function NuevoProductoPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 border-b pb-3">
        Crear Nuevo Producto
      </h1>
      {/* Renderiza el formulario sin datos iniciales (modo creación) */}
      <ProductForm />
    </div>
  );
}