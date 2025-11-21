// src/users/DTO/create-encargado.dto.ts
import { 
  IsString, 
  IsEmail, 
  IsNotEmpty, 
  IsOptional, 
  MinLength,
  IsUrl
} from 'class-validator';

export class CreateEncargadoDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  apellido: string;

  @IsString()
  @IsOptional()
  direccion?: string;

  @IsString()
  @IsNotEmpty()
  telefono: string;

  @IsString()
  @IsNotEmpty()
  curp: string;

  @IsString()
  @IsNotEmpty()
  sucursal: string; // O IsUUID si esperas el ID

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsUrl()
  @IsOptional()
  avatarUrl?: string;
}