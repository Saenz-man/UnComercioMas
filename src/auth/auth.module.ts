// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { RolesGuard } from './Guards/roles.guard';
@Module({
  imports: [
    UsersModule,
    PassportModule,
    // Configuración asíncrona para JWT (lee del .env)
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      // Tipado y uso de aserción no nula '!'
      useFactory: async (configService: ConfigService): Promise<any> => ({
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
    JwtStrategy,
    RolesGuard, // <-- REGISTRAR: El RolesGuard es un proveedor
  ],
  // Exportamos los Guards y servicios para que otros módulos (como UsersModule) puedan usarlos para proteger rutas
  exports: [
    AuthService,
    JwtModule,
    JwtStrategy,
    RolesGuard // <-- EXPORTAR: Permite usar @UseGuards(RolesGuard) en otros módulos
  ]
})
export class AuthModule { }