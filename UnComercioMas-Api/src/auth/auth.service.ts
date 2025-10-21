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

// === CORRECCIÓN CLAVE: El tipo Partial es global, solo necesitamos importar User ===
// ❌ ELIMINAR CUALQUIER INTENTO DE IMPORTAR 'Partial' DE user.entity.ts
// ===================================================================================

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
    // Nota: El chequeo de existencia sigue siendo buena práctica, aunque la DB lo fuerza.
    const existingUser = await this.usersService.findUserByEmail(registerDto.email);
    if (existingUser) {
       // Opcional, si deseas que el check previo sea más rápido que esperar el candado de la DB
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
    const user = await this.usersService.findUserByEmail(email);

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

  async login(user: Partial<User>): Promise<{ access_token: string }> {
    const payload = { 
      username: user.email, 
      sub: user.id,
      rol: user.rol,
    };
    
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}