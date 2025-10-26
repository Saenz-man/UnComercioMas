// src/types/category.types.ts

export interface Category {
  id: string;
  nombre: string;
  slug: string;
  id_padre: string | null;
  // Estos son opcionales, dependen de si tu API los devuelve al hacer GET /categories
  // Si tu API devuelve una lista plana, puedes quitarlos o mantenerlos como opcionales.
  parent?: Category | null; 
  children?: Category[];   
}