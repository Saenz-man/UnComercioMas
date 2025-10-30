// src/hooks/useProductVariants.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductService } from '@/services/product.service';
// Importamos los tipos correctos definidos en el archivo de tipos
import type { ProductVariant, CreateProductVariantPayload } from '../types/product-variant.types';

// Clave base para las queries de variantes de un producto
const variantsQueryKey = (productId: string | null | undefined) => ['productVariants', productId];

// --- Hook para OBTENER variantes de un producto ---
export const useProductVariants = (productId: string | null | undefined) => {
  return useQuery<ProductVariant[], Error>({
    // La queryKey incluye el productId para que sea única por producto
    queryKey: variantsQueryKey(productId), 
    // Llama al servicio pasando el ID del producto
    queryFn: () => ProductService.getVariantsByProductId(productId!), 
    // Solo se ejecuta si productId tiene un valor
    enabled: !!productId, 
    staleTime: 5 * 60 * 1000, // Opcional
  });
};

// --- Hook para CREAR una variante ---
export const useCreateVariant = (productId: string | null | undefined) => {
  const queryClient = useQueryClient();

  // Usamos 'CreateProductVariantPayload' como el tipo de entrada (Error, Payload)
  return useMutation<ProductVariant, Error, CreateProductVariantPayload>({
    // La función de mutación necesita el productId y el payload
    mutationFn: (payload) => ProductService.createVariant(productId!, payload),
    onSuccess: () => {
      // Invalida la caché de variantes de ESTE producto para recargar la lista
      queryClient.invalidateQueries({ queryKey: variantsQueryKey(productId) });
      console.log("Variante creada, caché invalidada.");
    },
    onError: (error) => {
      console.error("Error al crear variante:", error);
    }
  });
};

// --- Hook para ACTUALIZAR una variante ---
export const useUpdateVariant = (productId: string | null | undefined) => {
  const queryClient = useQueryClient();

  // Usamos 'Partial<CreateProductVariantPayload>' para el payload de actualización
  return useMutation<ProductVariant, Error, { variantId: string; payload: Partial<CreateProductVariantPayload> }>({
    mutationFn: ({ variantId, payload }) => ProductService.updateVariant(variantId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: variantsQueryKey(productId) });
      console.log("Variante actualizada, caché invalidada.");
    },
     onError: (error) => {
      console.error("Error al actualizar variante:", error);
    }
  });
};

// --- Hook para ELIMINAR una variante ---
export const useDeleteVariant = (productId: string | null | undefined) => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({ // Payload es el variantId (string)
    mutationFn: (variantId) => ProductService.deleteVariant(variantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: variantsQueryKey(productId) });
      console.log("Variante eliminada, caché invalidada.");
    },
     onError: (error) => {
      console.error("Error al eliminar variante:", error);
    }
  });
};