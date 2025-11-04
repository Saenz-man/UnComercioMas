/**
 * Hooks de React Query para el módulo de Productos.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductService } from '@/services/product.service';
import { CreateProductPayload, Product } from '@/types/product.types';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

// ======================================================
// --- Hook: Obtener todos los productos (con búsqueda opcional) ---
// ======================================================
export const useProducts = (search?: string) => {
  return useQuery<Product[]>({
    queryKey: ['products', search], // cachea por término de búsqueda
    queryFn: () => ProductService.getAll(search),
  });
};

// ======================================================
// --- Hook: Obtener un solo producto ---
// ======================================================
export const useProduct = (id?: string) => {
  return useQuery<Product>({
    queryKey: ['product', id],
    queryFn: () => ProductService.getById(id!),
    enabled: !!id,
  });
};

// ======================================================
// --- Hook: Crear producto (con Redirección) ---
// ======================================================
export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  const router = useRouter(); 

  return useMutation({
    mutationFn: (productData: CreateProductPayload) => ProductService.create(productData),

    onSuccess: (newProduct: Product) => {
      toast.success(`Producto "${newProduct.nombre}" creado exitosamente.`);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      router.push('/productos'); 
    },

    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message || error.message || 'Error desconocido al crear producto.';
      toast.error(`Error al crear producto: ${errorMessage}`);
    },
  });
};

// ======================================================
// --- Hook: Eliminar producto individual ---
// ======================================================
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => ProductService.delete(productId),

    onSuccess: (_, productId) => {
      toast.success('Producto eliminado con éxito.');
      queryClient.setQueryData<Product[] | undefined>(
        ['products'],
        (oldData) => oldData?.filter((p) => p.id !== productId)
      );
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.removeQueries({ queryKey: ['product', productId] });
    },

    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message || error.message || 'Error desconocido al eliminar producto.';
      toast.error(`Error al eliminar producto: ${errorMessage}`);
    },
  });
};


// ======================================================
// --- Hook: Actualizar producto (¡CORREGIDO!) ---
// ======================================================
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({
      productId,
      updateData,
    }: {
      productId: string;
      updateData: Partial<CreateProductPayload>;
    }) => {
      // --- INICIO DE LA CORRECCIÓN ---
      // Desestructuramos el payload para EXCLUIR SOLAMENTE 'variantes'
      const { 
        variantes, 
        ...payloadForUpdate // 'opciones' AHORA SÍ se queda en el payload
      } = updateData;

      // 'payloadForUpdate' ahora contiene:
      // nombre, slug, precio, fotos, Y TAMBIÉN 'opciones'
      // PERO YA NO CONTIENE:
      // 'variantes' (que es lo que causaba el Error 400 y el reseteo de stock)
      
      // Enviamos los datos del "Padre" Y la nueva estructura de opciones
      return ProductService.update(productId, payloadForUpdate);
      // --- FIN DE LA CORRECCIÓN ---
    },

    onSuccess: (updatedProduct: Product) => {
      toast.success(`Producto "${updatedProduct.nombre}" actualizado con éxito.`);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', updatedProduct.id] });
      router.push('/productos');
    },

    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message || error.message || 'Error desconocido al actualizar producto.';
      toast.error(`Error al actualizar producto: ${errorMessage}`);
    },
  });
};

// ======================================================
// --- Hook: Eliminar múltiples productos (Bulk Delete) ---
// ======================================================
export const useBulkDeleteProducts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productIds: string[]) => ProductService.bulkRemove(productIds),

    onSuccess: (_, productIds) => {
      toast.success(`Se eliminaron ${productIds.length} productos.`);
      queryClient.setQueryData<Product[] | undefined>(
        ['products'],
        (oldData) => oldData?.filter((p) => !productIds.includes(p.id))
      );
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },

    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message || error.message || 'Error desconocido al eliminar productos.';
      toast.error(`Error al eliminar masivamente: ${errorMessage}`);
      console.error('[useBulkDeleteProducts] Error:', error);
    },
  });
};

// ======================================================
// --- Hook: Eliminar variante individual ---
// ======================================================
export const useDeleteVariant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variantId: string) => ProductService.deleteVariant(variantId),

    onSuccess: () => {
      toast.success('Variante eliminada con éxito.');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },

    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message || error.message || 'Error desconocido al eliminar variante.';
      toast.error(`Error al eliminar variante: ${errorMessage}`);
    },
  });
};

