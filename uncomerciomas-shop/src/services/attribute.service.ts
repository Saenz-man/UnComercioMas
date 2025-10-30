/**
 * Servicio para manejar los atributos (Talla, Color, etc.)
 * Llama a los endpoints 'GET /api/v1/attributes'
 */
import { api } from '@/lib/api'; // Importa tu instancia de API (Axios)

// --- TIPOS DE RESPUESTA ---
// (Puedes moverlos a 'src/types/attribute.types.ts' si prefieres)

interface AttributeValue {
  id: string;
  valor: string;
}

export interface Attribute {
  id: string;
  nombre: string;
  valores: AttributeValue[];
}

// --- FUNCIONES DEL SERVICIO ---

/**
 * Obtiene todos los atributos y sus valores.
 * (Para poblar el formulario de creación de productos).
 */
const getAttributes = async (): Promise<Attribute[]> => {
  const { data } = await api.get<Attribute[]>('/attributes');
  return data;
};

/*
// --- Opcional: Funciones de Admin ---
// Puedes añadirlas aquí si necesitas un panel para gestionar atributos

const createAttribute = async (nombre: string): Promise<Attribute> => {
  const { data } = await api.post<Attribute>('/attributes', { nombre });
  return data;
};

const addAttributeValue = async (
  attributeId: string,
  valor: string,
): Promise<AttributeValue> => {
  const { data } = await api.post<AttributeValue>(
    `/attributes/${attributeId}/values`,
    { valor },
  );
  return data;
};

const removeAttributeValue = async (valueId: string): Promise<void> => {
  await api.delete(`/attributes/values/${valueId}`);
};
*/

export const attributeService = {
  getAttributes,
  // createAttribute,
  // addAttributeValue,
  // removeAttributeValue,
};

