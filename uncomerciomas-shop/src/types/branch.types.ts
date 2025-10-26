// src/types/branch.types.ts

export interface Branch {
  id: string;
  nombre: string;
  direccion: string | null; // Puede ser null
  telefono: string | null;  // Puede ser null
  es_matriz: boolean;
  tipo: string;
  created_at: string; // La API suele devolver fechas como strings ISO
  updated_at: string; // La API suele devolver fechas como strings ISO
  // Puedes añadir la relación 'inventario' aquí si la necesitas en el futuro
  // inventario?: BranchInventory[]; 
}

// Opcional: Si necesitas el tipo para la tabla pivote en el futuro
// import type { ProductVariant } from './product-variant.types'; // Asume que tienes este tipo
// export interface BranchInventory {
//   id: string;
//   stock: number;
//   sucursal_id: string; // O el objeto Branch completo si la API lo devuelve
//   variante_id: string; // O el objeto ProductVariant completo
//   variante?: ProductVariant; // Si la API lo anida
// }