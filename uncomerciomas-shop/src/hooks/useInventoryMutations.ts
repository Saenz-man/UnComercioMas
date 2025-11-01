import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api'; // O tu path a tu cliente 'api'
import { toast } from 'sonner';

// El DTO que espera el backend
interface TransferStockPayload {
  source_branch_id: string;
  destination_branch_id: string;
  variante_id: string;
  quantity: number;
}

// La función de servicio que llama a la API
const transferStock = (payload: TransferStockPayload) => {
  return api.post('/inventory/transfer', payload);
};

// El hook de mutación
export const useTransferStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: transferStock,
    
    // Cuando la mutación (individual) tiene éxito
    onSuccess: () => {
      // Invalidamos 'inventory' para que se recargue la lista de stock
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    
    // Si la mutación (individual) falla
    onError: (error: any) => {
      // Mostramos un toast de error
      toast.error("Error en una transferencia", {
        description: error.response?.data?.message || error.message,
      });
    },
  });
};