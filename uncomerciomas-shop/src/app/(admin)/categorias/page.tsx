// src/app/(admin)/categorias/page.tsx
import { CategoryManagement } from './CategoryManagement'; // Componente que crearemos

export default function CategoriasPage() {
  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
        Gestión de Categorías
      </h1>
      {/* Aquí irá la lógica para mostrar la lista y el formulario */}
      <CategoryManagement /> 
    </div>
  );
}