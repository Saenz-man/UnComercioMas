// src/services/product.service.ts
import { api } from '@/lib/api';
// Importa los tipos que definiste
import type { Product } from '@/types/product.types';
import type { VolumePricePayload } from '@/types/volume-price.types'; // Necesario para el payload
// --- NUEVOS TIPOS PARA VARIANTES ---
import type { ProductVariant } from '@/types/product-variant.types'; // <-- Correcto
// Define la estructura para crear/actualizar un producto (coincide con tu DTO de NestJS)
export interface ProductPayload {
  nombre: string;
  slug: string;
  descripcion?: string;
  precio_base: number;
  categoria_id: string; // Se envía el ID
  fotos?: string[];
  video?: string;
  opciones?: Record<string, any>; // Ej: {"Talla": ["S", "M"], ...}
  preciosPorVolumen?: VolumePricePayload[]; // Array de { cantidad_minima: number, precio: number }
}

// --- NUEVA INTERFAZ PARA PAYLOAD DE VARIANTE ---
// Payload para Crear/Actualizar Variante (coincide con DTOs de NestJS)
export interface VariantPayload {
  sku: string;
  stock: number;
  atributos: Record<string, string>; // Ej: { talla: 'S', color: 'Rojo' }
  foto_variante?: string; // Opcional
}
// --- FIN NUEVA INTERFAZ ---


export const ProductService = {
  /** Obtiene todos los productos "Padre" */
  async getAll(): Promise<Product[]> {
    console.log("[ProductService] Obteniendo todos los productos...");
    try {
      const { data } = await api.get<Product[]>('/products'); // Llama a GET /api/v1/products
      console.log("[ProductService] Productos obtenidos:", data);
      return data;
    } catch (error) {
      console.error("[ProductService] Error al obtener productos:", error);
      throw error; // Relanza para React Query
    }
  },

  /** Obtiene un producto "Padre" por su ID */
   async getById(id: string): Promise<Product> {
     console.log(`[ProductService] Obteniendo producto ${id}...`);
     try {
       const { data } = await api.get<Product>(`/products/${id}`); // Llama a GET /api/v1/products/:id
       console.log("[ProductService] Producto obtenido:", data);
       return data;
     } catch (error) {
       console.error(`[ProductService] Error al obtener producto ${id}:`, error);
       throw error;
     }
   },

  /** Crea un nuevo producto "Padre" */
  async create(payload: ProductPayload): Promise<Product> {
    console.log("[ProductService] Creando producto:", payload);
    try {
      const { data } = await api.post<Product>('/products', payload); // Llama a POST /api/v1/products
      console.log("[ProductService] Producto creado:", data);
      return data;
    } catch (error) {
      console.error("[ProductService] Error al crear producto:", error);
      throw error;
    }
  },

  /** Actualiza un producto "Padre" */
  async update(id: string, payload: Partial<ProductPayload>): Promise<Product> {
     console.log(`[ProductService] Actualizando producto ${id}:`, payload);
      try {
        const { data } = await api.patch<Product>(`/products/${id}`, payload); // Llama a PATCH /api/v1/products/:id
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
       await api.delete(`/products/${id}`); // Llama a DELETE /api/v1/products/:id
       console.log("[ProductService] Producto eliminado.");
     } catch (error) {
       console.error("[ProductService] Error al eliminar producto:", error);
       throw error;
     }
  },

  // ===========================================
  // === MÉTODOS PARA VARIANTES (AÑADIDOS) ===
  // ===========================================

  /** Obtiene todas las variantes de un producto específico */
  async getVariantsByProductId(productId: string): Promise<ProductVariant[]> {
    console.log(`[ProductService] Obteniendo variantes para producto ${productId}...`);
    try {
      // Llama a GET /api/v1/products/{productId}/variants
      const { data } = await api.get<ProductVariant[]>(`/products/${productId}/variants`);
      console.log(`[ProductService] Variantes obtenidas para ${productId}:`, data);
      return data;
    } catch (error) {
      console.error(`[ProductService] Error obteniendo variantes para ${productId}:`, error);
      throw error;
    }
  },

  /** Crea una nueva variante para un producto */
  async createVariant(productId: string, payload: VariantPayload): Promise<ProductVariant> {
    console.log(`[ProductService] Creando variante para producto ${productId}:`, payload);
    try {
      // Llama a POST /api/v1/products/{productId}/variants
      const { data } = await api.post<ProductVariant>(`/products/${productId}/variants`, payload);
      console.log(`[ProductService] Variante creada para ${productId}:`, data);
      return data;
    } catch (error) {
      console.error(`[ProductService] Error creando variante para ${productId}:`, error);
      throw error;
    }
  },

   /** Actualiza una variante específica por su ID */
  async updateVariant(variantId: string, payload: Partial<VariantPayload>): Promise<ProductVariant> {
     console.log(`[ProductService] Actualizando variante ${variantId}:`, payload);
      try {
        // Llama a PATCH /api/v1/products/variants/{variantId}
        const { data } = await api.patch<ProductVariant>(`/products/variants/${variantId}`, payload);
        console.log(`[ProductService] Variante actualizada ${variantId}:`, data);
        return data;
      } catch (error) {
        console.error(`[ProductService] Error actualizando variante ${variantId}:`, error);
        throw error;
      }
  },

   /** Elimina una variante específica por su ID */
  async deleteVariant(variantId: string): Promise<void> {
     console.log(`[ProductService] Eliminando variante ${variantId}`);
     try {
       // Llama a DELETE /api/v1/products/variants/{variantId}
       await api.delete(`/products/variants/${variantId}`);
       console.log(`[ProductService] Variante eliminada ${variantId}.`);
     } catch (error) {
       console.error(`[ProductService] Error eliminando variante ${variantId}:`, error);
       throw error;
     }
  }

  // (Aquí podrías añadir el método para bulkUpload si lo necesitas llamar desde el frontend)
  // async bulkUploadVariants(productId: string, file: File): Promise<{ count: number }> { ... }
};

// --- No olvides crear src/types/product-variant.types.ts ---
// export interface ProductVariant {
//   id: string;
//   sku: string;
//   stock: number;
//   atributos: Record<string, string>; // Ej: { talla: 'S', color: 'Rojo' }
//   foto_variante: string | null;
//   producto_id?: string; // Si la API lo devuelve
// }