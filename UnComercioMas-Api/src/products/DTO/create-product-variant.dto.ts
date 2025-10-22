// src/products/DTO/create-product-variant.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsNotEmpty, 
  IsInt,
  IsObject,
  Min,
  IsOptional
} from 'class-validator';

export class CreateProductVariantDto {

  @ApiProperty({ 
    description: 'SKU único de la variante (ej: 01010101)', 
    example: '01010101' 
  })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty({ 
    description: 'Stock físico de esta variante', 
    example: 150 
  })
  @IsInt()
  @Min(0)
  stock: number;

  @ApiProperty({ 
    description: 'Objeto de atributos que definen la variante', 
    example: { "talla": "XS", "color": "Amarillo" }
  })
  @IsObject()
  @IsNotEmpty()
  atributos: Record<string, string>;

  @ApiProperty({ 
    description: 'URL de la foto específica de esta variante (ej: camiseta amarilla)', 
    required: false 
  })
  @IsString()
  @IsOptional()
  foto_variante?: string;
}