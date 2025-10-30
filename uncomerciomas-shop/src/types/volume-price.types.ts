/**
 * Define los tipos de datos para los Precios por Volumen.
 */

// --- TIPO DE RESPUESTA ---
// Lo que la API devuelve anidado en el producto (basado en tu respuesta 201)
export interface VolumePrice {
  id: string;
  cantidad_minima: number;
  precio: string; // La API devuelve strings (ej. "80.00")
}

// --- TIPO DE ENVÍO (Payload) ---
// Lo que el formulario envía (basado en tu JSON de envío)
export interface CreateVolumePricePayload {
  cantidad_minima: number;
  precio: number; // Al enviar, es un número (ej. 80)
}

