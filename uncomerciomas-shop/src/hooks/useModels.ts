// src/hooks/useModels.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

/**
 * Hook para obtener modelos únicos a partir de los productos existentes
 */
export const useModels = () => {
  return useQuery({
    queryKey: ["models"],
    queryFn: async () => {
      const { data } = await api.get("/products"); // Usa tu endpoint real de productos
      if (!Array.isArray(data)) return [];

      // Extrae modelos únicos
      const modelosUnicos = Array.from(
        new Set(
          data
            .map((p: any) => p.modelo)
            .filter((m): m is string => typeof m === "string" && m.trim() !== "")
        )
      );

      // Los devolvemos como objetos simulando un "catálogo"
      return modelosUnicos.map((nombre, i) => ({
        id: `model-${i}`,
        nombre,
      }));
    },
  });
};
