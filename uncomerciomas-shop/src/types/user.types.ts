// src/types/user.types.ts

// Define los roles posibles que puede tener un usuario en el frontend
export type UserRoleFrontend = 'cliente' | 'vendedor' | 'admin' | 'superadmin';

// Define la estructura del objeto User que recibes de la API (SIN la contraseña)
export interface User {
  id: string;
  email: string;
  rol: UserRoleFrontend; // Usa el tipo definido arriba
  activo: boolean;
  fecha_creacion: string; // O Date si prefieres convertirlo

  // Añade aquí otros campos que devuelva tu API sobre el usuario, 
  // EXCEPTO 'hash_contrasena'
  // ej: detalles_vendedor?: any; 
}