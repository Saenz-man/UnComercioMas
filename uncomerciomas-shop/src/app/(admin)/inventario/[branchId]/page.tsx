// app/(admin)/inventario/[branchId]/page.tsx
import InventarioDetail from "../InventarioDetail"; // Importamos el componente renombrado

// 1. Definimos las props de la página para aceptar params
interface InventarioDetailPageProps {
  params: {
    branchId: string; // El branchId que viene de la URL (ej. /inventario/abc-123)
  };
}

// 2. Recibimos params y se lo pasamos al componente cliente
export default function Page({ params }: InventarioDetailPageProps) {
  return (
    <div>
      {/* 3. Pasamos el branchId como prop obligatoria */}
      <InventarioDetail branchId={params.branchId} />
    </div>
  );
}