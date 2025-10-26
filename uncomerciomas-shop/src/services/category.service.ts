// src/services/category.service.ts
import { api } from '@/lib/api';
// Asume que tienes un tipo Category definido en src/types
import type { Category } from '../types/category.types'; 

// Define la estructura de datos para crear/actualizar una categoría
export interface CategoryPayload {
  nombre: string;
  slug: string;
  id_padre?: string | null; // El ID del padre es opcional
}

export const CategoryService = {
  // Obtener todas las categorías (Público, no necesita token aquí)
  async getAll(): Promise<Category[]> {
    console.log("[CategoryService] Fetching all categories...");
    try {
      // Usa el endpoint público GET /categories
      const { data } = await api.get<Category[]>('/categories');
      console.log("[CategoryService] Fetched categories:", data);
      return data;
    } catch (error) {
      console.error("[CategoryService] Error fetching categories:", error);
      throw error;
    }
  },

  // Crear una nueva categoría (Requiere token, api.ts lo añade)
  async create(payload: CategoryPayload): Promise<Category> {
    console.log("[CategoryService] Creating category:", payload);
    try {
      // Usa el endpoint protegido POST /categories
      const { data } = await api.post<Category>('/categories', payload);
      console.log("[CategoryService] Category created:", data);
      return data;
    } catch (error) {
      console.error("[CategoryService] Error creating category:", error);
      throw error;
    }
  },

  // (Aquí añadirías 'update' y 'delete' más adelante)
  // async update(id: string, payload: Partial<CategoryPayload>): Promise<Category> { ... }
  // async delete(id: string): Promise<void> { ... } 
};

// --- (Opcional pero recomendado) Crea src/types/category.types.ts ---
// export interface Category {
//   id: string;
//   nombre: string;
//   slug: string;
//   id_padre: string | null;
//   parent?: Category | null; // Opcional si la API devuelve el padre anidado
//   children?: Category[];   // Opcional si la API devuelve hijos anidados
// }