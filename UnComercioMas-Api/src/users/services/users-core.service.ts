// src/users/services/users-core.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { USER_REPOSITORY_TOKEN } from '../users.constants'; // Usamos la constante centralizada
import * as Contract from '../../shared/interfaces/user-repository.interface';
import type { User } from '../entities/user.entity'; // Importamos el tipo User

@Injectable()
export class UsersCoreService {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: Contract.IUserRepository,
  ) {}

  // 1. Método de Registro (Usado en AuthService.registerClient)
  async registerNewClient(data: Partial<User>): Promise<Partial<User>> {
    return this.userRepository.create(data);
  }

  // 2. Método de Búsqueda por Email (Usado en AuthService.validateUser)
  async findUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  // 3. Método de Búsqueda por ID (CORRECCIÓN: Usado en JwtStrategy.validate)
  async findById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }
}