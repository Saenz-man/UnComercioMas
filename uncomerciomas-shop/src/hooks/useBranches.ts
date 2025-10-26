// src/hooks/useBranches.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BranchService, BranchPayload } from '@/services/branch.service';
import type { Branch } from '../types/branch.types'; 

// --- Hook para OBTENER todas las sucursales ---
export const useBranches = () => {
  return useQuery<Branch[], Error>({
    queryKey: ['branches'], // Clave única para la caché
    queryFn: BranchService.getAll, // Llama al método del servicio
    staleTime: 5 * 60 * 1000, // Considera datos frescos por 5 mins (opcional)
  });
};

// --- Hook para CREAR una sucursal ---
export const useCreateBranch = () => {
  const queryClient = useQueryClient();

  return useMutation<Branch, Error, BranchPayload>({
    mutationFn: BranchService.create,
    onSuccess: () => {
      // Invalida la caché de 'branches' para recargar la lista
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

  // El tipo de la mutación necesita el ID y el payload
  return useMutation<Branch, Error, { id: string; payload: Partial<BranchPayload> }>({
    mutationFn: ({ id, payload }) => BranchService.update(id, payload),
    onSuccess: (updatedBranch) => {
      // Invalida la caché general
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      // Opcional: Actualizar directamente la caché con el dato modificado
      // queryClient.setQueryData(['branches'], (oldData: Branch[] | undefined) =>
      //   oldData ? oldData.map(b => b.id === updatedBranch.id ? updatedBranch : b) : []
      // );
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

  return useMutation<void, Error, string>({ // El payload es solo el ID (string)
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