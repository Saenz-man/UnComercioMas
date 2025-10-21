import { Injectable, ConflictException } from '@nestjs/common'; // Agregamos ConflictException
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm'; // Importamos QueryFailedError

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
  async create(user: Partial<User>): Promise<User> {
    try {
      const newUser = this.repository.create(user);
      return await this.repository.save(newUser);
    } catch (error) {
      // 🛑 CANDADO DE SEGURIDAD: Atrapar la violación de unicidad de PostgreSQL
      if (error instanceof QueryFailedError && error['code'] === '23505') {
        // El código '23505' es el código estándar de PostgreSQL para una violación de restricción única.
        throw new ConflictException('El correo electrónico ya está registrado (restricción de DB).');
      }
      // Si no es un error de unicidad, relanzamos el error original.
      throw error;
    }
  }

  // Los métodos de búsqueda permanecen sin cambios
  async findByEmail(email: string): Promise<User | null> {
    // Nota: Agregamos select: false para que hash_contrasena se incluya en la búsqueda
    return this.repository.findOne({ 
        where: { email },
        select: ['id', 'email', 'rol', 'hash_contrasena', 'activo'] // Especificamos los campos que necesitamos para el login
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.repository.findOne({ where: { id } });
  }
}