// src/shared/interfaces/user-repository.interface.ts
import type { User } from '../../users/entities/user.entity';

export interface IUserRepository {
  /** Registra un nuevo usuario */
  create(user: Partial<User>): Promise<User>; // Devuelve User completo ahora

  /** Busca un usuario por su correo electrónico */
  findByEmail(email: string, selectPassword?: boolean): Promise<User | null>; // Añadido parámetro opcional

  /** Busca un usuario por su ID */
  findById(id: string): Promise<User | null>;

  find(options: any): Promise<User[]>;

  // Opcional: findAll?(): Promise<User[]>;
}