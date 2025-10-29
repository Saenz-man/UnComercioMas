// src/users/repositories/users-postgres.repository.ts
import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';

import { IUserRepository } from '../../shared/interfaces/user-repository.interface';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersPostgresRepository implements IUserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  /**
   * Registra un nuevo usuario en la DB, implementando el candado de unicidad.
   */
  async create(user: Partial<User>): Promise<User> { // Devuelve User completo
    try {
      const newUser = this.repository.create(user);
      // Save devuelve la entidad guardada, incluyendo campos por defecto como IDs, fechas
      return await this.repository.save(newUser);
    } catch (error) {
      // 🛑 CANDADO DE SEGURIDAD: Atrapar la violación de unicidad de PostgreSQL
      if (error instanceof QueryFailedError && error['code'] === '23505') {
        throw new ConflictException('El correo electrónico ya está registrado (restricción de DB).');
      }
      // Si no es un error de unicidad, relanzamos el error original.
      throw error;
    }
  }

  /**
   * Busca un usuario por email, seleccionando condicionalmente la contraseña.
   */
  async findByEmail(
    email: string,
    selectPassword = false, // Recibe el parámetro
  ): Promise<User | null> {
    
    // Usamos QueryBuilder para seleccionar campos dinámicamente
    const queryBuilder = this.repository.createQueryBuilder('user')
      .select(['user.id', 'user.email', 'user.rol', 'user.activo']) // Campos base siempre seleccionados
      .where('user.email = :email', { email });

    // Añadir contraseña solo si se pide
    if (selectPassword) {
      queryBuilder.addSelect('user.hash_contrasena');
    }

    return queryBuilder.getOne(); // Ejecutar
  }

  /**
   * Busca un usuario por su ID.
   */
  async findById(id: string): Promise<User | null> {
    // findOneBy es simple y seguro para buscar por ID
    return this.repository.findOneBy({ id });
  }
}