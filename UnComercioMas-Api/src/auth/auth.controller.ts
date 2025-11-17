// src/auth/auth.controller.ts
import { Body, Controller, Post, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBody, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  // ENDPOINT 1: REGISTRO (POST /auth/register)
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un nuevo cliente (Usuario Público)' })
  @ApiBody({ type: RegisterDto })
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.authService.registerClient(registerDto);

    const { hash_contrasena, ...result } = user;
    return result;
  }

  // ENDPOINT 2: LOGIN (POST /auth/login) - TAREA S1.9
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
}