// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; 
import { User } from './entities/user.entity'; 

import { UsersPostgresRepository } from './repositories/users-postgres.repository';
import { UsersCoreService } from './services/users-core.service'; 
import { USER_REPOSITORY_TOKEN } from './users.constants';

@Module({
  imports: [
    // Registra la entidad User en TypeORM
    TypeOrmModule.forFeature([User]), 
  ],
  providers: [
    UsersCoreService,
    // Vinculación del Patrón Repositorio
    {
      provide: USER_REPOSITORY_TOKEN, 
      useClass: UsersPostgresRepository, 
    },
  ],
  // === CORRECCIÓN CLAVE: Exportar el servicio y el token ===
  exports: [
    UsersCoreService, // <--- AÑADIDO: Ahora AuthModule puede inyectarlo
    USER_REPOSITORY_TOKEN
  ],
})
export class UsersModule {}