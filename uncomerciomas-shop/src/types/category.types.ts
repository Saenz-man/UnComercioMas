/**
 * Define los tipos de datos para las Categorías.
 */

// --- TIPO DE RESPUESTA ---
// Lo que la API devuelve (basado en tu POST de categorías)
export interface Category {
  id: string;
  nombre: string;
  slug: string;
  id_padre: string | null;
}

// --- TIPO DE ENVÍO (Payload) ---
// Lo que el formulario de "Crear Categoría" enviaría
export interface CreateCategoryPayload {
  nombre: string;
  slug: string;
  id_padre?: string | null;
}

