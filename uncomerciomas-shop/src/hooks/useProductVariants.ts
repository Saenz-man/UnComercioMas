// src/hooks/useProductVariants.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductService } from '@/services/product.service';
// Importamos los tipos correctos definidos en el archivo de tipos
import type { ProductVariant, CreateProductVariantPayload } from '../types/product-variant.types';

// Clave base para las queries de variantes de un producto
const variantsQueryKey = (productId: string | null | undefined) => ['productVariants', productId];

// --- INICIO DE LA CORRECCIÓN ---
// Clave base para la query del producto PADRE (la que usa el formulario)
const productQueryKey = (productId: string | null | undefined) => ['product', productId];
// --- FIN DE LA CORRECCIÓN ---


// --- Hook para OBTENER variantes de un producto ---
export const useProductVariants = (productId: string | null | undefined) => {
  return useQuery<ProductVariant[], Error>({
    queryKey: variantsQueryKey(productId), 
    queryFn: () => ProductService.getVariantsByProductId(productId!), 
    enabled: !!productId, 
    staleTime: 5 * 60 * 1000, // Opcional
  });
};

// --- Hook para CREAR una variante ---
export const useCreateVariant = (productId: string | null | undefined) => {
  const queryClient = useQueryClient();

  return useMutation<ProductVariant, Error, CreateProductVariantPayload>({
    mutationFn: (payload) => ProductService.createVariant(productId!, payload),
    onSuccess: () => {
      // --- INICIO DE LA CORRECCIÓN ---
      // ¡Invalidamos la query del producto PADRE!
      // Esto hará que el formulario se actualice con la nueva variante.
      queryClient.invalidateQueries({ queryKey: productQueryKey(productId) });
      
      // Opcional: también invalidar la lista de 'variantes' por si se usa en otro lado
      queryClient.invalidateQueries({ queryKey: variantsQueryKey(productId) });
      console.log("Variante creada, caché de PRODUCTO invalidada.");
      // --- FIN DE LA CORRECCIÓN ---
    },
    onError: (error) => {
      console.error("Error al crear variante:", error);
    }
  });
};

// --- Hook para ACTUALIZAR una variante ---
export const useUpdateVariant = (productId: string | null | undefined) => {
  const queryClient = useQueryClient();

  return useMutation<ProductVariant, Error, { variantId: string; payload: Partial<CreateProductVariantPayload> }>({
    mutationFn: ({ variantId, payload }) => ProductService.updateVariant(variantId, payload),
    onSuccess: () => {
      // --- INICIO DE LA CORRECCIÓN ---
      queryClient.invalidateQueries({ queryKey: productQueryKey(productId) });
      queryClient.invalidateQueries({ queryKey: variantsQueryKey(productId) });
      console.log("Variante actualizada, caché de PRODUCTO invalidada.");
      // --- FIN DE LA CORRECCIÓN ---
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
      // --- INICIO DE LA CORRECCIÓN ---
      queryClient.invalidateQueries({ queryKey: productQueryKey(productId) });
      queryClient.invalidateQueries({ queryKey: variantsQueryKey(productId) });
      console.log("Variante eliminada, caché de PRODUCTO invalidada.");
      // --- FIN DE LA CORRECCIÓN ---
    },
     onError: (error) => {
      console.error("Error al eliminar variante:", error);
    }
  });
};

