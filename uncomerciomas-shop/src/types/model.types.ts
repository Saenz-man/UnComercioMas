// src/types/model.types.ts

/**
 * Tipo para un Modelo (lo que recibes de la API)
 */
export interface Model {
  id: string; // o number, dependiendo de tu API
  nombre: string;
}

/**
 * Payload para crear un nuevo Modelo (lo que envías a la API)
 */
export interface ModelPayload {
  nombre: string;
}