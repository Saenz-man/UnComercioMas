// src/auth/dto/login.dto.ts

import { IsEmail, IsNotEmpty, MinLength, IsString } from 'class-validator'; // <-- Añadir IsString
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {

  @ApiProperty({ example: 'superadmin@uncomerciomas.com', description: 'Correo electrónico del usuario para iniciar sesión.' })
  @IsEmail({}, { message: 'El correo electrónico no es válido.' })
  @IsNotEmpty({ message: 'El correo es obligatorio.' })
  email: string;

  @ApiProperty({ example: 'Admin12345', description: 'Contraseña del usuario.' })
  @IsString() // <-- Añadir IsString
  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  password: string; // <-- Cambiar el nombre aquí
}