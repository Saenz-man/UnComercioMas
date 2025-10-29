import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsObject,
  IsUrl,
  Min,
} from 'class-validator';

export class CreateProductVariantDto {
  @ApiProperty({
    description: 'El SKU único',
    example: 'PLAYERA-BRUSH-H-CH-BLANCO',
  })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty({ description: 'Stock de esta variante', example: 50 })
  @IsNumber({}, { message: 'El stock debe ser un número.' })
  @Min(0, { message: 'El stock no puede ser un número negativo.' })
  stock: number;

  // REQUISITO CLAVE: Foto específica del SKU
  @ApiProperty({
    description: 'URL de la foto para esta variante específica',
    required: false,
  })
  @IsString()
  @IsOptional()
  foto?: string;

  // REQUISITO CLAVE: Opciones de esta variante
  @ApiProperty({
    description: 'Combinación de opciones',
    example: { Talla: 'CH', Color: 'Blanco' },
  })
  @IsObject()
  @IsNotEmpty()
  opciones: Record<string, string>; // Ej: { "Talla": "CH", "Color": "Blanco" }

  // Puedes añadir más campos si el precio o peso varían
  @ApiProperty({
    description: 'Precio de esta variante (si es diferente al padre)',
    required: false,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El precio de la variante debe ser un número.' },
  )
  @IsPositive({
    message: 'El precio de la variante debe ser mayor a $0.0', // <--- AQUÍ
  })
  @IsOptional()
  precio?: number;
}
