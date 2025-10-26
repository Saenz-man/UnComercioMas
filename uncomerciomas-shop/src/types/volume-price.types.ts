// src/types/volume-price.types.ts

// Tipo para los datos que vienen de la API
export interface VolumePrice {
 id: string;
 cantidad_minima: number;
 precio: string | number; // Ajusta según lo que devuelva tu API
}

// Tipo para enviar datos al crear/actualizar (coincide con el DTO anidado)
export interface VolumePricePayload { 
 cantidad_minima: number;
 precio: number; // Al enviar, usualmente es un número
}