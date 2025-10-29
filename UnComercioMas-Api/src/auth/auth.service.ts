// src/auth/auth.service.ts
import {
  ConflictException,
  Injectable,
  UnauthorizedException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UsersCoreService } from '../users/services/users-core.service';
import { User, UserRole } from '../users/entities/user.entity';
import { RegisterDto } from './DTO/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersCoreService,
    private readonly jwtService: JwtService,
  ) {}

  // ----------------------------------------------------
  // LÓGICA DE REGISTRO (POST /auth/register)
  // ----------------------------------------------------
  async registerClient(registerDto: RegisterDto): Promise<Partial<User>> {
    const existingUser = await this.usersService.findUserByEmail(registerDto.email);
    if (existingUser) {
       throw new ConflictException('El correo electrónico ya está registrado.');
    }

    const newUser = await this.usersService.registerNewClient({
      ...registerDto,
      rol: UserRole.CLIENTE,
      activo: true,
    });

    const { hash_contrasena, ...result } = newUser;
    return result;
  }

  // ----------------------------------------------------
  // LÓGICA DE LOGIN (POST /auth/login)
  // ----------------------------------------------------
  async validateUser(email: string, pass: string): Promise<Partial<User> | null> {
    const user = await this.usersService.findUserByEmail(email, true); // Asegúrate de pedir la contraseña

    if (!user || !user.hash_contrasena || user.activo === false) {
      return null;
    }

    const isMatch = await bcrypt.compare(pass, user.hash_contrasena);

    if (isMatch) {
      const { hash_contrasena, ...result } = user;
      return result;
    }
    return null;
  }

  // --- MÉTODO LOGIN MODIFICADO ---
  async login(user: Partial<User>): Promise<{ access_token: string; user: Partial<User> }> {
    const payload = {
      username: user.email,
      sub: user.id,
      rol: user.rol,
    };

    // Preparamos el objeto user para devolver (sin campos sensibles si los hubiera)
    const userResponse = {
        id: user.id,
        email: user.email,
        rol: user.rol
        // Puedes añadir más campos seguros si los necesitas en el frontend
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: userResponse // <-- Devolvemos el usuario también
    };
  }
  // --- FIN DE MODIFICACIÓN ---
}