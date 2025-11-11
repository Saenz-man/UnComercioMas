// src/users/services/users-core.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { USER_REPOSITORY_TOKEN } from '../users.constants';
import * as Contract from '../../shared/interfaces/user-repository.interface';
import type { User } from '../entities/user.entity';

@Injectable()
export class UsersCoreService {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: Contract.IUserRepository,
  ) {}

  /**
   * Método de Registro (Usado en AuthService.registerClient)
   * Devuelve el usuario sin la contraseña.
   */
  async registerNewClient(data: Partial<User>): Promise<Partial<User>> { // Devuelve Partial<User>
    const newUser = await this.userRepository.create(data);
    // Quitamos la contraseña antes de devolverla desde el servicio
    const { hash_contrasena, ...result } = newUser;
    return result; // Ya es Partial<User>
  }

  /**
   * Método de Búsqueda por Email (Usado en AuthService.validateUser)
   * Acepta y pasa el parámetro selectPassword.
   */
  async findUserByEmail(
    email: string,
    selectPassword = false, // Recibe el parámetro opcional
  ): Promise<User | null> {
    // Pasa el parámetro al repositorio
    return this.userRepository.findByEmail(email, selectPassword);
  }

  /**
   * Método de Búsqueda por ID (Usado en JwtStrategy.validate)
   */
  async findById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }
}