/**
 * Define los tipos de datos principales para el Producto.
 */

// --- Importaciones de todos los sub-tipos ---
import type { Category } from './category.types';
import type { VolumePrice, CreateVolumePricePayload } from './volume-price.types';
import type { ProductVariant, CreateProductVariantPayload } from './product-variant.types';

// --- TIPO DE RESPUESTA ---
// Lo que la API devuelve (basado 100% en tu respuesta 201)
// --- ¡NUEVA LÍNEA! ---
// Re-exportamos los tipos importados para que estén disponibles
export type { Category, VolumePrice, CreateVolumePricePayload, ProductVariant, CreateProductVariantPayload };
// --- FIN DE LA NUEVA LÍNEA ---
export interface Product {
  id: string;
  nombre: string;
  modelo: string | null;
  slug: string;
  descripcion: string | null;
  precioPorPieza: string; // La API devuelve "100.00"
  fotos: string[];
  video: string | null;
  opciones: Record<string, string[]>;
  categoria: Category; // Objeto anidado
  preciosPorVolumen: VolumePrice[]; // Array anidado
  variantes: ProductVariant[]; // Array anidado
  created_at: string;
  updated_at: string;
}

// --- TIPO DE ENVÍO (Payload) ---
// El "molde" para tu formulario. Coincide 1-a-1 con el JSON que SÍ funcionó.
export interface CreateProductPayload {
  nombre: string;
  modelo: string | null;
  descripcion: string | null;
  precioPorPieza: number; // Envías un número
  categoria_id: string; // Envías el ID
  slug: string;
  
  preciosPorVolumen?: CreateVolumePricePayload[];
  fotos: (string | null)[];
  video: string | null;

  opciones: Record<string, string[]>;
  variantes: CreateProductVariantPayload[];
}

