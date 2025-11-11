// src/auth/auth.controller.ts
import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  UseGuards, // <-- 1. AÑADIR
  Req, // <-- 2. AÑADIR
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBody, ApiResponse } from '@nestjs/swagger'; 
import { AuthService } from '../auth.service';
import { RegisterDto } from '../DTO/register.dto'; 
import { LoginDto } from '../DTO/login.dto'; 
import { AuthGuard } from '@nestjs/passport'; // <-- 3. AÑADIR

// --- 4. AÑADIR IMPORTS ---
import { CreateVendedorDto } from '../DTO/create-vendedor.dto';
import { Roles } from '../Decorators/roles.decorator';        
import { RolesGuard } from '../Guards/roles.guard';          
import { User, UserRole } from '../../users/entities/user.entity'; 
// --- FIN DE AÑADIR ---

@ApiTags('Autenticación')
@Controller('api/v1/auth') // <-- 5. AÑADIR RUTA BASE /api/v1
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ENDPOINT 1: REGISTRO (POST /api/v1/auth/register)
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un nuevo cliente (Usuario Público)' })
  @ApiBody({ type: RegisterDto }) 
  async register(@Body() registerDto: RegisterDto) { 
    const user = await this.authService.registerClient(registerDto);
    
    // Tu servicio ya quita el hash, esto es redundante pero seguro
    const { hash_contrasena, ...result } = user; 
    return result;
  }

  // ENDPOINT 2: LOGIN (POST /api/v1/auth/login)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login de usuario (Cliente, Vendedor o Admin)' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Devuelve el token de acceso.' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas.' })
  async login(@Body() loginDto: LoginDto) {
    
    const user = await this.authService.validateUser(
        loginDto.email, 
        loginDto.password
    );

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }
    
    return this.authService.login(user);
  }

  
  // --- INICIO: NUEVO ENDPOINT (CORREGIDO) ---
  
  @Post('register-vendedor')
  @ApiOperation({ summary: 'ADMIN: Registrar un nuevo Vendedor o Admin' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente.' })
  @ApiResponse({ status: 403, description: 'Permisos insuficientes.' })
  @ApiResponse({ status: 404, description: 'Sucursal no encontrada.' })
  @ApiResponse({ status: 409, description: 'Email o Username ya en uso.' })
  @UseGuards(AuthGuard('jwt'), RolesGuard) // Protegido por tu JwtStrategy y RolesGuard
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN) // Solo Admins
  async registerVendedor(
    @Req() req: { user: User }, // 6. Obtener el admin logueado
    @Body() createVendedorDto: CreateVendedorDto, 
  ) {
    // 7. Pasar AMBOS argumentos al servicio (Corrige Error 1)
  }
  // --- FIN: NUEVO ENDPOINT ---
}