// src/branches/DTO/create-branch.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsBoolean 
} from 'class-validator';

export class CreateBranchDto {

  @ApiProperty({ description: 'Nombre de la sucursal', example: 'Matriz CDMX' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ description: 'Dirección física', required: false })
  @IsString()
  @IsOptional()
  direccion?: string;

  @ApiProperty({ description: 'Teléfono de contacto', required: false })
  @IsString()
  @IsOptional()
  telefono?: string;

  @ApiProperty({ 
    description: 'Indica si esta es la sucursal matriz (principal)', 
    default: false 
  })
  @IsBoolean()
  @IsOptional()
  es_matriz?: boolean;

  @ApiProperty({ 
    description: 'Tipo de sucursal (ej: bodega, tienda, oficina)', 
    default: 'sucursal' 
  })
  @IsString()
  @IsOptional()
  tipo?: string;
}