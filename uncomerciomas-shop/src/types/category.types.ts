/**
 * Define los tipos de datos para las Colecciones.
 */

// --- TIPO DE RESPUESTA ---
// Lo que la API devuelve (basado en tu POST de Colecciones)
export interface Category {
  id: string;
  nombre: string;
  slug: string;
  id_padre: string | null;
}

// --- TIPO DE ENVÍO (Payload) ---
// Lo que el formulario de "Crear Coleccion" enviaría
export interface CreateCategoryPayload {
  nombre: string;
  slug: string;
  id_padre?: string | null;
}

