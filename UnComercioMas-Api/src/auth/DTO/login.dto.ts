// src/auth/dto/login.dto.ts

import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'; 

export class LoginDto {
  
  @ApiProperty({ example: 'superadmin@uncomerciomas.com', description: 'Correo electrónico del usuario para iniciar sesión.' })
  @IsEmail({}, { message: 'El correo electrónico no es válido.' })
  @IsNotEmpty({ message: 'El correo es obligatorio.' })
  email: string;

  @ApiProperty({ example: 'Admin12345', description: 'Contraseña del usuario.' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  hash_contrasena: string; // Usamos el mismo nombre para simplificar la toma de datos
}