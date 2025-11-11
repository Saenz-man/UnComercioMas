// src/categories/DTO/create-category.dto.ts
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  
  @ApiProperty({ example: 'Ropa para Hombre', description: 'Nombre visible de la categoría.' })
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @ApiProperty({ example: 'ropa-hombre', description: 'Slug URL amigable (debe ser único).' })
  @IsNotEmpty()
  @IsString()
  slug: string;

  @ApiProperty({ 
      example: null, 
      description: 'ID de la categoría padre para jerarquía. Dejar en null si es categoría principal.', 
      required: false 
  })
  @IsOptional()
  @IsUUID()
  id_padre?: string | null;
}