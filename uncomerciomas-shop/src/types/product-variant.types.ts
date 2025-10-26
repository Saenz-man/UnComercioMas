// src/types/product-variant.types.ts

// Define la estructura del objeto ProductVariant que recibes de la API
export interface ProductVariant {
  id: string;
  sku: string;
  stock: number;
  // Atributos que definen la variante (ej: { talla: 'S', color: 'Rojo' })
  atributos: Record<string, string>;
  foto_variante: string | null; // URL opcional de la foto específica

  // Puedes incluir el ID del producto padre si tu API lo devuelve
  // producto_id?: string;
}