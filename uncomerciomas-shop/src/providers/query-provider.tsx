"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

// 1. CREAMOS UNA INSTANCIA GLOBAL (fuera del estado/componente)
// Esto asegura que la misma instancia sea accesible para los servicios.
export const queryClient = new QueryClient({
    // Opcional: Configuraciones por defecto si las tienes
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutos, por ejemplo
        },
    },
});

export default function QueryProvider({ children }: { children: ReactNode }) {
  // 2. USAMOS LA INSTANCIA GLOBAL
  // Eliminamos useState ya que ahora es una instancia global singleton
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}