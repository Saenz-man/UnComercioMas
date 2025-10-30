/**
 * Define los tipos de datos para las Variantes de Producto (SKUs).
 */

// --- TIPO DE RESPUESTA ---
// Lo que la API devuelve anidado en el producto (basado en tu respuesta 201)
export interface ProductVariant {
  id: string;
  sku: string;
  stock: number;
  // La API devuelve 'atributos'
  atributos: Record<string, string>;
  // La API devuelve 'foto_variante'
  foto_variante: string | null;
  precio: string
}

// --- TIPO DE ENVÍO (Payload) ---
// Lo que el formulario envía (basado en tu JSON de envío)
export interface CreateProductVariantPayload {
  sku: string;
  stock: number;
  // El formulario envía 'foto'
  foto: string | null;
  // El formulario envía 'opciones' (que el backend renombra a 'atributos')
  opciones: Record<string, string>;
  precio?: number; // El precio individual de la variante
  
}

