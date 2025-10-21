// src/auth/dto/register.dto.ts
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'; // <-- Importar este decorador

export class RegisterDto {
  
  @ApiProperty({ example: 'nuevo.cliente@ejemplo.com', description: 'Correo electrónico único del nuevo cliente.' })
  @IsEmail({}, { message: 'El correo electrónico no es válido.' })
  @IsNotEmpty({ message: 'El correo es obligatorio.' })
  email: string;

  @ApiProperty({ example: 'MiContraseñaSegura123', description: 'La contraseña debe tener al menos 8 caracteres.' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  hash_contrasena: string; 
}