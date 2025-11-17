// src/auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

import { UsersCoreService } from '../users/services/users-core.service';
import { User } from '../users/entities/user.entity';

interface JwtPayload {
  username: string;
  sub: string;
  rol: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersCoreService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  // Valida el payload después de que el token es decodificado
  async validate(payload: JwtPayload): Promise<Partial<User>> {
    // 1. Candado de autenticación: Buscar el usuario por ID
    const user = await this.usersService.findById(payload.sub);

    if (!user || user.activo === false) {
      // Lanza 401 Unauthorized
      throw new UnauthorizedException('Token inválido o usuario inactivo.');
    }

    // 2. Retornar el objeto usuario (sin hash) para inyectarlo en req.user
    const { hash_contrasena, ...result } = user;
    return result;
  }
}