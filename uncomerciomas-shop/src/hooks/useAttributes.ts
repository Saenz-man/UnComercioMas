
//typescript:src/hooks/useAttributes.ts
/**
 * Hook de React Query para obtener todos los atributos (Talla, Color, etc.)
 */
import { useQuery } from '@tanstack/react-query';
import { attributeService } from '@/services/attribute.service';

export const useAttributes = () => {
  return useQuery({
    // 'queryKey' es el identificador único de esta "consulta"
    queryKey: ['attributes'],
    
    // 'queryFn' es la función que buscará los datos (la de tu servicio)
    queryFn: attributeService.getAttributes,
    
    // Opcional: Los atributos no cambian mucho.
    // Le decimos a React Query que no los vuelva a pedir por 5 minutos.
    staleTime: 1000 * 60 * 5,
  });
};
