// src/hooks/useProducts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductService, ProductPayload } from '@/services/product.service';
import type { Product } from '@/types/product.types';

// --- Hook para OBTENER todos los productos ---
export const useProducts = () => {
  return useQuery<Product[], Error>({
    queryKey: ['products'], // Clave para la caché
    queryFn: ProductService.getAll, // Llama al método del servicio
    staleTime: 5 * 60 * 1000, // Datos frescos por 5 mins (opcional)
  });
};

// --- Hook para OBTENER un producto por ID ---
// Útil para la página de edición o detalle
export const useProductById = (productId: string | null) => {
  return useQuery<Product, Error>({
    queryKey: ['product', productId], // Clave incluye el ID
    queryFn: () => ProductService.getById(productId!), // Llama al método del servicio
    enabled: !!productId, // Solo ejecuta la consulta si productId no es null
    staleTime: 1 * 60 * 1000, // Datos frescos por 1 min (opcional)
  });
};

// --- Hook para CREAR un producto ---
export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation<Product, Error, ProductPayload>({
    mutationFn: ProductService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] }); // Invalida la lista
      console.log("Producto creado, caché invalidada.");
    },
    onError: (error) => {
      console.error("Error al crear producto:", error);
    }
  });
};

// --- Hook para ACTUALIZAR un producto ---
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation<Product, Error, { id: string; payload: Partial<ProductPayload> }>({
    mutationFn: ({ id, payload }) => ProductService.update(id, payload),
    onSuccess: (updatedProduct) => {
      // Invalida la lista y la vista individual
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', updatedProduct.id] }); 
      // Opcional: Actualizar caché directamente
      // queryClient.setQueryData(['products'], (old: Product[] | undefined) => /* ... */ );
      console.log("Producto actualizado, caché invalidada.");
    },
    onError: (error) => {
      console.error("Error al actualizar producto:", error);
    }
  });
};

// --- Hook para ELIMINAR un producto ---
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({ // Payload es el ID (string)
    mutationFn: ProductService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] }); // Invalida la lista
      console.log("Producto eliminado, caché invalidada.");
    },
    onError: (error) => {
      console.error("Error al eliminar producto:", error);
    }
  });
};