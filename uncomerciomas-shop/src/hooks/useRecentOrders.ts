// src/hooks/useRecentOrders.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api'; // Tu instancia de axios configurada
import type { Order } from '@/types/order.types'; // Importa el tipo que acabas de crear

// Función que llama a la API
const fetchRecentOrders = async (limit: number = 5): Promise<Order[]> => {
  console.log(`[useRecentOrders] Fetching ${limit} recent orders...`);
  try {
    const { data } = await api.get<Order[]>('/orders/admin/recent-orders', { // Ajusta la URL si es necesario
      params: { limit }, // Pasa el límite como query param
    });
    console.log(`[useRecentOrders] Fetched orders:`, data);
    return data;
  } catch (error) {
    console.error(`[useRecentOrders] Error fetching orders:`, error);
    throw error; // Relanza el error para que React Query lo maneje
  }
};

// Hook personalizado
export const useRecentOrders = (limit: number = 5) => {
  return useQuery<Order[], Error>({ // Tipos para datos y error
    queryKey: ['recentOrders', limit], // Clave única (incluye el límite para recargar si cambia)
    queryFn: () => fetchRecentOrders(limit), // Llama a la función de fetch
    staleTime: 5 * 60 * 1000, // Datos frescos por 5 minutos (opcional)
    // refetchOnWindowFocus: false, // Puedes desactivar recargas automáticas si prefieres
  });
};