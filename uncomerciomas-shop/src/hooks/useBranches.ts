// src/hooks/useBranches.ts
import { useQuery, useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import { BranchService, BranchPayload } from '@/services/branch.service';
import type { Branch } from '../types/branch.types'; 

// 🛑 LÍNEA ELIMINADA: Ya NO exportamos useQueryClient() aquí, ya que viola las reglas de Hooks.
//    Se asume que 'product.service.ts' importará la instancia global de QueryClient 
//    desde '@/providers/QueryProvider'.

// --- Hook para OBTENER todas las sucursales ---
export const useBranches = () => {
  return useQuery<Branch[], Error>({
    queryKey: ['branches'],
    queryFn: BranchService.getAll,
    staleTime: 5 * 60 * 1000, 
  });
};

// =========================================================
// === FUNCIONES PARA OBTENER LA MATRIZ DINÁMICA ===
// =========================================================

/**
 * 1. Función para obtener el ID de la sucursal matriz desde la caché.
 * NOTA: Usaremos 'QueryClient' directamente en el tipo en lugar de 'typeof queryClient'.
 * @returns El ID de la matriz o null si no se encuentra.
 */
export const getMatrizIdFromCache = (client: QueryClient): string | null => { // <--- Tipo corregido
  // Se usa client.getQueryData, ya no hay error de hooks.
  const branches = client.getQueryData<Branch[]>(['branches']);
  
  if (!branches) {
    console.warn("La caché de 'branches' está vacía. No se puede obtener el ID de la Matriz.");
    return null;
  }
  
  // Busca la sucursal que tenga el flag 'es_matriz: true'
  const matriz = branches.find(branch => branch.es_matriz === true);
  
  return matriz ? matriz.id : null;
};

/**
 * 2. Hook para usar el ID de la matriz en componentes React.
 * @returns El ID de la matriz o null si no se encuentra.
 */
export const useMatrizId = (): string | null => {
  const { data: branches } = useBranches();
  
  if (!branches) {
    return null;
  }
  
  const matriz = branches.find(branch => branch.es_matriz === true);
  
  return matriz ? matriz.id : null;
};


// --- Hook para CREAR una sucursal ---
export const useCreateBranch = () => {
  const queryClient = useQueryClient();
  return useMutation<Branch, Error, BranchPayload>({
    mutationFn: BranchService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      console.log("Sucursal creada, caché invalidada.");
    },
    onError: (error) => {
      console.error("Error al crear sucursal:", error);
    }
  });
};

// --- Hook para ACTUALIZAR una sucursal ---
export const useUpdateBranch = () => {
  const queryClient = useQueryClient();
  return useMutation<Branch, Error, { id: string; payload: Partial<BranchPayload> }>({
    mutationFn: ({ id, payload }) => BranchService.update(id, payload),
    onSuccess: (updatedBranch) => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      console.log("Sucursal actualizada, caché invalidada.");
    },
    onError: (error) => {
      console.error("Error al actualizar sucursal:", error);
    }
  });
};

// --- Hook para ELIMINAR una sucursal ---
export const useDeleteBranch = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: BranchService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      console.log("Sucursal eliminada, caché invalidada.");
    },
    onError: (error) => {
      console.error("Error al eliminar sucursal:", error);
    }
  });
};