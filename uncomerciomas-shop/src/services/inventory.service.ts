// services/inventory.service.ts

import { api } from '@/lib/api'; 
import axios from 'axios'; 

// --- TIPOS ---
export interface InventoryAssignmentPayload {
  sucursal_id: string;
  variante_id: string; // El SKU del producto
  stock: number;
}
// 🛑 Eliminada la exportación de ID_SUCURSAL_MATRIZ

/**
 * Llama a la API para asignar stock inicial a una sucursal (Matriz).
 * POST /api/v1/inventory/assign
 */
export async function assignInventoryToBranch(payload: InventoryAssignmentPayload): Promise<void> {
    try {
        await api.post('/inventory/assign', payload); 
        console.log(`[InventoryService] Inventario de SKU ${payload.variante_id} asignado a sucursal ${payload.sucursal_id}.`);
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 409) {
            console.warn(`[InventoryService] SKU ${payload.variante_id} ya existe en matriz. Se omite asignación inicial (PATCH necesario).`);
            return; 
        }
        
        console.error('[InventoryService] Falló la asignación inicial de inventario:', error);
        throw error;
    }
}