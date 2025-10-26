// src/types/order.types.ts

// Define la estructura simplificada del cliente que podría venir con la orden
interface OrderClient {
  id: string;
  email: string;
  nombre?: string; // Asume que tienes un campo nombre o similar
}

// Define la estructura principal de la Orden
export interface Order {
  id: string;
  monto_total: number;
  estado: string; // O puedes usar un tipo literal: 'pendiente' | 'procesando' | ...
  fecha_creacion: string; // O Date
  cliente?: OrderClient; // O el nombre del campo que uses en el backend (ej: 'usuario')
  // Añade aquí cualquier otro campo que devuelva tu endpoint /recent-orders
  // ej: tipo_entrega?: string;
}