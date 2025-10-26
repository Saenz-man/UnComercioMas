// src/types/product.types.ts
import type { Category } from './category.types'; // Asume que ya tienes este
import type { VolumePrice } from './volume-price.types'; // Importa el tipo de precio

export interface Product {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  // La API devuelve números como strings a veces, ajusta si es necesario
  precio_base: string | number; 
  fotos: string[];
  video: string | null;
  opciones: Record<string, string[]>; // Ej: { "Talla": ["S", "M"], "Color": ["Rojo"] }
  
  // Asume que la API anida el objeto categoría completo
  categoria: Category; 
  
  // Asume que la API anida los precios por volumen (`eager: true` en backend)
  preciosPorVolumen: VolumePrice[]; 

  created_at: string; // O Date
  updated_at: string; // O Date
  // Nota: sku y stock ya no están aquí
}