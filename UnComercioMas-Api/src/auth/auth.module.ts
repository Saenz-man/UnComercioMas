// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport'; 
import { JwtModule } from '@nestjs/jwt';          
import { ConfigModule, ConfigService } from '@nestjs/config'; 

import { UsersModule } from '../users/users.module'; 
import { AuthController } from './auth.controller'; 
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy'; 

@Module({
  imports: [
    UsersModule, 
    PassportModule,
    // Configuración asíncrona para JWT (lee del .env)
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      // CORRECCIÓN 1: Tipamos el retorno como Promise<any> para evitar el conflicto estricto
      useFactory: async (configService: ConfigService): Promise<any> => ({
        // CORRECCIÓN 2: Usar '!' para asegurar que los valores existen
        secret: configService.get<string>('JWT_SECRET')!, 
        signOptions: { 
          expiresIn: configService.get<string>('JWT_EXPIRATION_TIME')!,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService, 
    JwtStrategy 
  ],
})
export class AuthModule {}