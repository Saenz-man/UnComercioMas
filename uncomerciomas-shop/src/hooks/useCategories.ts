// src/hooks/useCategories.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CategoryService, CategoryPayload } from '@/services/category.service';
import type { Category } from '@/types/category.types';

// Hook para obtener todas las categorías
export const useCategories = () => {
  return useQuery<Category[], Error>({
    queryKey: ['categories'], // Clave para la caché
    queryFn: CategoryService.getAll, // Llama al método del servicio
    staleTime: Infinity, // Considera las categorías 'frescas' indefinidamente (o ajusta)
  });
};

// Hook para la mutación (crear categoría)
export const useCreateCategory = () => {
  const queryClient = useQueryClient(); // Para invalidar la caché después de crear

  return useMutation<Category, Error, CategoryPayload>({ // Define tipos: Retorno, Error, Payload
    mutationFn: CategoryService.create, // Llama al método de creación del servicio
    onSuccess: () => {
      // Cuando la creación es exitosa, invalida la caché de 'categories'
      // para que React Query vuelva a pedirlas (y muestre la nueva)
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      console.log("Categoría creada, caché invalidada.");
      // Aquí podrías mostrar una notificación de éxito
    },
    onError: (error) => {
      console.error("Error al crear categoría:", error);
      // Aquí podrías mostrar una notificación de error
    }
  });
};

// (Aquí añadirías 'useUpdateCategory' y 'useDeleteCategory' más adelante)