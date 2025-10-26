// src/app/(admin)/sucursales/page.tsx
import { BranchManagement } from '../branches/BranchManagement'; // <-- Importa el componente

export default function SucursalesPage() {
  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
        Gestión de Sucursales
      </h1>
      {/* Usa el componente de gestión */}
      <BranchManagement /> 
    </div>
  );
}