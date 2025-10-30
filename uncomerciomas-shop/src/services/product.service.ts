/**
 * Servicio para manejar los productos (CRUD).
 * Llama a los endpoints 'GET /api/v1/products', 'POST /api/v1/products', etc.
 */
import { api } from '@/lib/api';
import { assignInventoryToBranch } from './inventory.service';
import { queryClient } from '@/providers/query-provider';
import { getMatrizIdFromCache } from '@/hooks/useBranches'; 

// --- TIPOS REQUERIDOS ---
import type { Product, CreateProductPayload } from '@/types/product.types';
import type { ProductVariant, CreateProductVariantPayload } from '@/types/product-variant.types';
// ------------------------

// --- FUNCIÓN UTILITARIA INTERNA PARA OBTENER EL ID DINÁMICO ---
const getMatrizId = (): string | null => {
    // Intenta obtener el ID de la matriz desde la caché de React Query
    const matrizId = getMatrizIdFromCache(queryClient); 
    if (!matrizId) {
        console.error("🔴 ERROR: ID de la Matriz no encontrado en la caché de sucursales. Asignación de stock fallará.");
    }
    return matrizId;
};
// ----------------------------------------------------------------------


// Mantenemos tu nombre de exportación 'ProductService'
export const ProductService = {
  /** Obtiene todos los productos "Padre" */
  async getAll(): Promise<Product[]> { /* ... tu código ... */ 
    console.log("[ProductService] Obteniendo todos los productos...");
    try {
      const { data } = await api.get<Product[]>('/products'); 
      console.log("[ProductService] Productos obtenidos:", data);
      return data;
    } catch (error) {
      console.error("[ProductService] Error al obtener productos:", error);
      throw error;
    }
  },

  /** Obtiene un producto "Padre" por su ID */
   async getById(id: string): Promise<Product> { /* ... tu código ... */ 
     console.log(`[ProductService] Obteniendo producto ${id}...`);
     try {
       const { data } = await api.get<Product>(`/products/${id}`); 
       console.log("[ProductService] Producto obtenido:", data);
       return data;
     } catch (error) {
       console.error(`[ProductService] Error al obtener producto ${id}:`, error);
       throw error;
     }
   },

  // --- MÉTODO CREATE ACTUALIZADO! (MATRIZ DINÁMICA) ---
  /** * Crea un nuevo producto "Padre" y asigna el stock de todas sus variantes a la matriz. */
  async create(payload: CreateProductPayload): Promise<Product> { 
    console.log("[ProductService] Creando producto:", payload);
    let newProduct: Product;
    
    // 1. Lógica de creación de producto
    try {
      const { data } = await api.post<Product>('/products', payload); 
      newProduct = data;
      console.log("[ProductService] Producto creado:", newProduct);
    } catch (error) {
      console.error("[ProductService] Error al crear producto:", error);
      throw error; 
    }

    // 2. ASIGNACIÓN DE INVENTARIO A LA MATRIZ (Dinámica)
    const matrizId = getMatrizId(); 
    
    if (matrizId && newProduct.variantes && newProduct.variantes.length > 0) {
        console.log(`[ProductService] Iniciando asignación de inventario inicial a Matriz: ${matrizId}...`);
        
        const assignments = newProduct.variantes.map(variant => {
            // Buscamos el DTO original para obtener el stock
            const originalDto = payload.variantes.find(v => v.sku === variant.sku);

            return assignInventoryToBranch({
                sucursal_id: matrizId,
                variante_id: variant.id, // ✅ Usamos el ID de la variante guardada, no el SKU
                stock: originalDto?.stock || 0,
            });
        });
        
        await Promise.allSettled(assignments);
        console.log("[ProductService] Asignación de inventario inicial completada.");
    }

    return newProduct;
  },

  /** Actualiza un producto "Padre" */
  async update(id: string, payload: Partial<CreateProductPayload>): Promise<Product> {
     console.log(`[ProductService] Actualizando producto ${id}:`, payload);
      try {
        const { data } = await api.patch<Product>(`/products/${id}`, payload);
        console.log("[ProductService] Producto actualizado:", data);
        return data;
      } catch (error) {
        console.error("[ProductService] Error al actualizar producto:", error);
        throw error;
      }
  },

  /** Elimina un producto "Padre" (y sus variantes) */
  async delete(id: string): Promise<void> {
     console.log(`[ProductService] Eliminando producto ${id}`);
     try {
       await api.delete(`/products/${id}`);
       console.log("[ProductService] Producto eliminado.");
     } catch (error) {
       console.error("[ProductService] Error al eliminar producto:", error);
       throw error;
     }
  },

  // --- ¡NUEVO!: MÉTODO PARA BORRADO MASIVO ---
  /** Elimina múltiples productos "Padre" por sus IDs. */
  async bulkRemove(productIds: string[]): Promise<void> {
    console.log(`[ProductService] Eliminación masiva de ${productIds.length} productos.`);
    try {
      // Llama a DELETE /api/v1/products/bulk, enviando los IDs en el cuerpo
     await api.delete('/products/bulk', { data: productIds });
      console.log("[ProductService] Borrado masivo completado.");
    } catch (error) {
      console.error("[ProductService] Error en borrado masivo:", error);
      throw error;
    }
  },
  // ------------------------------------------

  // ===========================================
  // === MÉTODOS PARA VARIANTES ===
  // ===========================================

  /** Obtiene todas las variantes de un producto específico */
  async getVariantsByProductId(productId: string): Promise<ProductVariant[]> { /* ... tu código ... */
    console.log(`[ProductService] Obteniendo variantes para producto ${productId}...`);
    try {
      const { data } = await api.get<ProductVariant[]>(`/products/${productId}/variants`);
      console.log(`[ProductService] Variantes obtenidas para ${productId}:`, data);
      return data;
    } catch (error) {
      console.error(`[ProductService] Error obteniendo variantes para ${productId}:`, error);
      throw error;
    }
  },

  // --- MÉTODO createVariant ACTUALIZADO! (MATRIZ DINÁMICA) ---
  /** Crea una nueva variante para un producto y asigna el stock a la matriz. */
  async createVariant(productId: string, payload: CreateProductVariantPayload): Promise<ProductVariant> { 
    console.log(`[ProductService] Creando variante para producto ${productId}:`, payload);
    let newVariant: ProductVariant;
    
    // 1. Lógica de creación de variante
    try {
      const { data } = await api.post<ProductVariant>(`/products/${productId}/variants`, payload);
      newVariant = data;
      console.log(`[ProductService] Variante creada para ${productId}:`, newVariant);
    } catch (error) {
      console.error(`[ProductService] Error creando variante para ${productId}:`, error);
      throw error;
    }

    // 2. ASIGNACIÓN DE INVENTARIO A LA MATRIZ (Dinámica)
    const matrizId = getMatrizId(); // <--- ID OBTENIDO DINÁMICO

    if (matrizId) {
        await assignInventoryToBranch({
            sucursal_id: matrizId,
            variante_id: newVariant.id, // ✅ Usamos el ID de la variante guardada, no el SKU
            stock: payload.stock || 0,   
        });
    }

    return newVariant;
  },

   /** Actualiza una variante específica por su ID */
  async updateVariant(variantId: string, payload: Partial<CreateProductVariantPayload>): Promise<ProductVariant> { /* ... tu código ... */
     console.log(`[ProductService] Actualizando variante ${variantId}:`, payload);
      try {
        const { data } = await api.patch<ProductVariant>(`/products/variants/${variantId}`, payload);
        console.log(`[ProductService] Variante actualizada ${variantId}:`, data);
        return data;
      } catch (error) {
        console.error(`[ProductService] Error actualizando variante ${variantId}:`, error);
        throw error;
      }
  },

   /** Elimina una variante específica por su ID */
  async deleteVariant(variantId: string): Promise<void> { /* ... tu código ... */
     console.log(`[ProductService] Eliminando variante ${variantId}`);
     try {
       await api.delete(`/products/variants/${variantId}`);
       console.log(`[ProductService] Variante eliminada ${variantId}.`);
     } catch (error) {
       console.error(`[ProductService] Error eliminando variante ${variantId}:`, error);
       throw error;
     }
  }
};