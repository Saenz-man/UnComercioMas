import { useQuery, useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
// Importamos el hook para obtener el ID de la matriz
import { useMatrizId } from '@/hooks/useBranches';

import type { Branch } from '@/types/branch.types';
// ProductVariant type import can be removed if the structure below is sufficient

// =======================================================
// 1. TIPOS CORREGIDOS Y EXPORTADOS (Usando 'atributos')
// =======================================================

export interface InventoryItem {
    id: string; // ID de la entrada de inventario
    stock: number;

    // Detallamos la estructura anidada de la variante para el inventario
    variante: {
        id: string;
        sku: string;
        // 🛑 Usamos 'atributos' para coincidir con la API
        atributos: Record<string, string>; // <-- Correcto

        // PRODUCTO PADRE: Datos completos
        producto: {
            id: string;
            nombre: string;
            precioPorPieza: number;
            modelo: string;
            categoria: {
                id: string;
                nombre: string;
            };
            fotos: string[];
        };
        foto_variante?: string | null;
    }
    sucursal: Branch; // Necesario para onSuccess de useAssignInventory
    created_at: string;
    updated_at: string;
}

interface AssignInventoryPayload {
    sucursal_id: string;
    variante_id: string;
    stock: number;
}

// Interfaz para la respuesta del PATCH (solo ID y stock)
interface UpdateStockApiResponse {
    id: string;
    stock: number;
}

interface UpdateInventoryPayload {
    inventoryId: string;
    stock: number;
}
// -----------------

// --- CLAVES DE REACT QUERY ---
const INVENTORY_QUERY_KEY = 'branchInventory';
const PRODUCT_INVENTORY_KEY = 'productInventoryByVariant';

// =======================================================
// 2. OBTENER INVENTARIO DE UNA SUCURSAL (GET /inventory/branch/{sucursalId})
// =======================================================
export const useBranchInventory = (sucursalId: string | null) => {
    return useQuery<InventoryItem[], Error>({
        queryKey: [INVENTORY_QUERY_KEY, sucursalId],
        queryFn: async () => {
            if (!sucursalId) {
                return [];
            }
            // Asume que la API devuelve objetos que coinciden con InventoryItem
            const response = await api.get<InventoryItem[]>(`/inventory/branch/${sucursalId}`);
            return response.data;
        },
        enabled: !!sucursalId,
    });
};

// =======================================================
// 3. HOOK PRINCIPAL (Filtra por Matriz)
// =======================================================
export const useInventory = () => {
    const matrizId = useMatrizId();
    return useBranchInventory(matrizId);
};


// =======================================================
// 4. ASIGNAR STOCK INICIAL (POST /inventory/assign)
// =======================================================
export const useAssignInventory = () => {
    const queryClient = useQueryClient();

    return useMutation<InventoryItem, Error, AssignInventoryPayload>({
        mutationFn: async (payload) => {
            const response = await api.post<InventoryItem>('/inventory/assign', payload);
            return response.data;
        },
        onSuccess: (newItem) => {
            // Aquí sí tenemos newItem.sucursal.id de la respuesta del POST
            queryClient.invalidateQueries({ queryKey: [INVENTORY_QUERY_KEY, newItem.sucursal.id] });
        },
    });
};

// =======================================================
// 5. ACTUALIZAR STOCK (PATCH /inventory/{inventoryId}) - CORREGIDO
// =======================================================
export const useUpdateInventoryStock = () => {
    const queryClient = useQueryClient();

    // El tipo genérico del resultado de la mutación ahora es UpdateStockApiResponse
    return useMutation<UpdateStockApiResponse, Error, UpdateInventoryPayload>({
        mutationFn: async ({ inventoryId, stock }) => {
            const response = await api.patch<UpdateStockApiResponse>(`/inventory/${inventoryId}`, { stock });
            return response.data; // Devuelve { id, stock }
        },
        // 🛑 FIX: Invalidamos la query general 'branchInventory'
        // porque la respuesta del PATCH no incluye sucursal.id.
        onSuccess: (updatedData, variables) => {
            console.log(`Stock actualizado para ID ${variables.inventoryId}. Invalidando caché general.`);
            queryClient.invalidateQueries({ queryKey: [INVENTORY_QUERY_KEY] });
            // Si necesitaras invalidar solo la sucursal específica, tendrías que pasar
            // sucursalId como parte del payload de la mutación o encontrarla de otra forma.
        },
        // onMutate se mantiene igual (opcional)
        onMutate: async ({ inventoryId, stock }) => {
            return { inventoryId };
        }
    });
};

// =======================================================
// 6. ELIMINAR ENTRADA (DELETE /inventory/{inventoryId})
// =======================================================
export const useDeleteInventoryItem = () => {
    const queryClient = useQueryClient();

    return useMutation<void, Error, string>({
        mutationFn: async (inventoryId) => {
            await api.delete(`/inventory/${inventoryId}`);
        },
        onSuccess: (data, inventoryId) => {
            // Invalida toda la caché de inventario
            queryClient.invalidateQueries({ queryKey: [INVENTORY_QUERY_KEY] });
        },
    });
};

// =======================================================
// 7. CONSULTAR STOCK POR SKU EN TODAS LAS SUCURSALES (Extra)
// =======================================================
export const useProductInventoryByVariant = (varianteId: string | null) => {
    // Nota: El tipo de retorno debe coincidir con la respuesta real de este endpoint
    return useQuery<InventoryItem[], Error>({
        queryKey: [PRODUCT_INVENTORY_KEY, varianteId],
        queryFn: async () => {
            if (!varianteId) {
                return [];
            }
            const response = await api.get<InventoryItem[]>(`/inventory/variant/${varianteId}`);
            return response.data;
        },
        enabled: !!varianteId,
    });
};