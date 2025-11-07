// src/products/DTO/update-product.dto.ts

import { PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product-dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsObject,
  IsOptional,
  IsArray,
  ValidateNested,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateProductVariantDto } from './create-product-variant.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @ApiPropertyOptional({
    description:
      'Opciones disponibles del producto actualizadas. Las claves son dinámicas (por ejemplo: Talla, Color, Material...)',
    example: {
      Talla: ['CH', 'M', 'G', 'XL'],
      Color: ['Blanco', 'Negro', 'Azul'],
    },
  })
  @IsObject({ message: 'Las opciones deben ser un objeto válido.' })
  @IsOptional()
  opciones?: Record<string, string[]>;

  @ApiPropertyOptional({
    description:
      'Lista de variantes (SKUs) actualizadas del producto. Cada variante puede tener combinaciones nuevas o modificadas.',
    type: [CreateProductVariantDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariantDto)
  @IsOptional()
  variantes?: CreateProductVariantDto[];

  @ApiPropertyOptional({
    description: 'Slug actualizado del producto',
    example: 'playera-brush-manga-corta-actualizada',
  })
  @IsString()
  @IsOptional()
  slug?: string;
}
