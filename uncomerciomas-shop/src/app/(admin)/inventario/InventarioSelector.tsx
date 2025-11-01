// app/(admin)/inventario/InventarioSelector.tsx
"use client";

import { useRouter } from 'next/navigation';
import { useBranches } from '@/hooks/useBranches';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Warehouse, Loader2, AlertCircle, Star } from 'lucide-react';

// Tarjeta de carga
const LoadingCard = () => (
  <Skeleton className="h-32 w-full" />
);

export function InventarioSelector() {
  const router = useRouter();
  const { data: branches, isLoading, error } = useBranches();

  const handleBranchClick = (branchId: string) => {
    router.push(`/inventario/${branchId}`);
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Seleccionar Inventario</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => <LoadingCard key={i} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-red-600 flex items-center">
        <AlertCircle className="h-5 w-5 mr-2" /> 
        Error al cargar sucursales: {(error as any).message}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Seleccionar Inventario</h1>
      <p className="text-muted-foreground">
        Elige una sucursal para gestionar su inventario.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {branches && branches.map(branch => (
          <Card 
            key={branch.id} 
            onClick={() => handleBranchClick(branch.id)}
            className="cursor-pointer hover:border-primary transition-all shadow-md hover:shadow-lg"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">
                {branch.nombre}
              </CardTitle>
              {branch.es_matriz ? (
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              ) : (
                <Warehouse className="h-5 w-5 text-muted-foreground" />
              )}
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {branch.direccion || "Sin dirección registrada"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}