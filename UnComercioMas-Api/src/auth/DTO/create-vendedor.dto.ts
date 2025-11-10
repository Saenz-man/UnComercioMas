import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsNotEmpty,
  MinLength,
  IsUUID,
  IsOptional,
  IsEnum,
  Matches,
} from 'class-validator';
// Importamos tu Enum de Roles desde la entidad de usuario
import { UserRole } from '../../users/entities/user.entity';

// Opcional: Regex para validación de datos en México
const CURP_REGEX =
  /^[A-Z][AEIOUX][A-Z]{2}[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])[HM][A-Z]{5}[A-Z0-9][0-9]$/;
const RFC_REGEX =
  /^[A-Z&Ñ]{3,4}[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])[A-Z0-9]{2}[0-9A]$/;

export class CreateVendedorDto {
  // --- CAMPOS DE LA ENTIDAD 'User' ---

  @ApiProperty({ description: 'Correo para iniciar sesión' })
  @IsEmail({}, { message: 'El email no es válido.' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Contraseña (min. 8 caracteres)' })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  password: string;

  @ApiProperty({
    enum: [UserRole.ADMIN, UserRole.VENDEDOR],
    description: 'Rol a asignar',
  })
  @IsEnum([UserRole.ADMIN, UserRole.VENDEDOR], {
    message: 'El rol debe ser "admin" o "vendedor".',
  })
  rol: UserRole;

  // --- CAMPOS QUE IRÁN EN EL JSON 'detalles_vendedor' ---

  @ApiProperty({ description: 'Nombre(s) del empleado' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ description: 'Apellido(s) del empleado' })
  @IsString()
  @IsNotEmpty()
  apellido: string;

  @ApiProperty({ description: 'Username único del sistema (para login opcional)' })
  @IsString()
  @IsNotEmpty()
  username: string; // Tu campo "Usuario"

  @ApiProperty({ description: 'ID de la sucursal a la que pertenece' })
  @IsUUID('4')
  @IsNotEmpty()
  sucursalId: string; // Tu campo "Asignación de sucursal"

  @ApiProperty({ description: 'Puesto del empleado', example: 'Vendedor de Piso' })
  @IsString()
  @IsNotEmpty()
  puesto: string; // Tu campo "Puesto o rol exacto"

  @ApiProperty({ description: 'Horario (solo data)', example: 'L-V 9am-6pm' })
  @IsString()
  @IsNotEmpty()
  horario_turno: string; // Tu campo "Horario y turno"

  @ApiProperty({ description: 'CURP del empleado', required: false })
  @IsOptional()
  @Matches(CURP_REGEX, { message: 'El CURP no tiene un formato válido.' })
  curp?: string;

  @ApiProperty({ description: 'RFC del empleado', required: false })
  @IsOptional()
  @Matches(RFC_REGEX, { message: 'El RFC no tiene un formato válido.' })
  rfc?: string;

  @ApiProperty({ description: 'Dirección del empleado', required: false })
  @IsOptional()
  @IsString()
  direccion?: string;

  @ApiProperty({ description: 'URL a la foto de perfil', required: false })
  @IsOptional()
  @IsString()
  foto_perfil_url?: string; // Tu campo "Fotografía"

  @ApiProperty({ description: 'URL a la foto de la ID', required: false })
  @IsOptional()
  @IsString()
  identificacion_url?: string; // Tu campo "Identificación oficial"
}