// src/services/model.service.ts

// CORRECCIÓN 1: Importa 'api' (probablemente es el nombre correcto)
import { api } from '@/lib/api'; 
// CORRECCIÓN 2: Importa los tipos desde el archivo de tipos
import type { Model, ModelPayload } from '@/types/model.types'; // <-- Esta línea falla
// Asumo que el endpoint de tu API para modelos es '/models'
const API_URL = '/models'; 

/**
 * Obtiene todos los modelos
 */
const getAll = async (): Promise<Model[]> => {
  // CORRECCIÓN 1: Usa 'api'
  const { data } = await api.get<Model[]>(API_URL);
  return data;
};

/**
 * Crea un nuevo modelo
 */
const create = async (payload: ModelPayload): Promise<Model> => {
  // CORRECCIÓN 1: Usa 'api'
  const { data } = await api.post<Model>(API_URL, payload);
  return data;
};

export const ModelService = {
  getAll,
  create,
};