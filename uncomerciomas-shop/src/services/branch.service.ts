// src/services/branch.service.ts
import { api } from '@/lib/api';
// Asume que tienes un tipo Branch definido en src/types
import type { Branch } from '../types/branch.types'; 

// Define la estructura de datos para crear/actualizar una sucursal
// Coincide con tu CreateBranchDto del backend
export interface BranchPayload {
  nombre: string;
 direccion?: string | null; 
  telefono?: string | null;
  es_matriz?: boolean;
  tipo?: string;
}

export const BranchService = {
  // Obtener todas las sucursales (Público)
  async getAll(): Promise<Branch[]> {
    console.log("[BranchService] Fetching all branches...");
    try {
      const { data } = await api.get<Branch[]>('/branches');
      console.log("[BranchService] Fetched branches:", data);
      return data;
    } catch (error) {
      console.error("[BranchService] Error fetching branches:", error);
      throw error;
    }
  },

  // Crear una nueva sucursal (Requiere token)
  async create(payload: BranchPayload): Promise<Branch> {
    console.log("[BranchService] Creating branch:", payload);
    try {
      const { data } = await api.post<Branch>('/branches', payload);
      console.log("[BranchService] Branch created:", data);
      return data;
    } catch (error) {
      console.error("[BranchService] Error creating branch:", error);
      throw error;
    }
  },

  // Actualizar una sucursal (Requiere token)
  async update(id: string, payload: Partial<BranchPayload>): Promise<Branch> {
    console.log(`[BranchService] Updating branch ${id}:`, payload);
     try {
       const { data } = await api.patch<Branch>(`/branches/${id}`, payload);
       console.log("[BranchService] Branch updated:", data);
       return data;
     } catch (error) {
       console.error("[BranchService] Error updating branch:", error);
       throw error;
     }
  },

  // Eliminar una sucursal (Requiere token)
  async delete(id: string): Promise<void> {
    console.log(`[BranchService] Deleting branch ${id}`);
    try {
      await api.delete(`/branches/${id}`);
      console.log("[BranchService] Branch deleted.");
    } catch (error) {
      console.error("[BranchService] Error deleting branch:", error);
      throw error;
    }
  }
};

// --- (Opcional pero recomendado) Crea src/types/branch.types.ts ---
// export interface Branch {
//   id: string;
//   nombre: string;
//   direccion: string | null;
//   telefono: string | null;
//   es_matriz: boolean;
//   tipo: string;
//   created_at: string; // O Date
//   updated_at: string; // O Date
//   // Añade la relación 'inventario' si la necesitas en el frontend aquí
// }