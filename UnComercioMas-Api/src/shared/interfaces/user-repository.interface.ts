// src/shared/interfaces/user-repository.interface.ts

// Usar 'import type' para importar la clase/entidad User
// La entidad User es solo un TIPO en el contexto de la interfaz.
import type { User } from '../../users/entities/user.entity';

export interface IUserRepository {
  /** Registra un nuevo usuario (cliente o admin) */
  create(user: Partial<User>): Promise<User>;

  /** Busca un usuario por su correo electrónico (necesario para el login) */
  findByEmail(email: string): Promise<User | null>;

  /** Busca un usuario por su ID (necesario para verificar el token JWT) */
  findById(id: string): Promise<User | null>;
  
  // Opcional: Métodos CRUD de administración
  // findAll(): Promise<User[]>; 
}