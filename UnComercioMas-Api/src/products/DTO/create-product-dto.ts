// src/products/DTO/create-product-dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsNotEmpty, 
  IsNumber, 
  IsUUID, 
  IsOptional,
  Min,
  IsPositive,
  IsArray,
  ValidateNested,
  IsInt,
  IsUrl,     // <-- Para validar URLs de video
  IsObject   // <-- Para validar el objeto 'opciones'
} from 'class-validator';
import { Type } from 'class-transformer';

// --- DTO Anidado para Precios por Volumen (Se queda igual) ---
class CreateVolumePriceDto {
  
  @ApiProperty({ description: 'Cantidad mínima para este precio', example: 10 })
  @IsInt()
  @IsPositive()
  cantidad_minima: number;

  @ApiProperty({ description: 'Precio para esta cantidad', example: 95.50 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  precio: number;
}
// -----------------------------------------------------------------


export class CreateProductDto {

  @ApiProperty({ description: 'Nombre del producto', example: 'Camiseta Olimpica' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ description: 'Slug único para URL', example: 'camiseta-olimpica' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ description: 'Descripción detallada', example: 'Una camiseta cómoda...', required: false })
  @IsString()
  @IsOptional()
  descripcion?: string;

  // --- CAMPO 'sku' ELIMINADO ---

  @ApiProperty({ description: 'Precio base (menudeo)', example: 100.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  precio_base: number;

  // --- CAMPO 'stock' ELIMINADO ---

  @ApiProperty({ description: 'ID (UUID) de la categoría a la que pertenece' })
  @IsUUID()
  @IsNotEmpty()
  categoria_id: string; 

  // --- Precios por Volumen (Se queda igual) ---
  @ApiProperty({
    description: 'Array opcional de precios por volumen (mayoreo, distribuidor)',
    type: [CreateVolumePriceDto], 
    required: false,
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true }) 
  @Type(() => CreateVolumePriceDto) 
  preciosPorVolumen?: CreateVolumePriceDto[];

  // ------------------------------------------
  // --- NUEVOS CAMPOS (Refactor S2.5) ---
  // ------------------------------------------

  @ApiProperty({
    description: 'Array de URLs de las fotos del producto',
    example: ['https://.../foto1.jpg', 'https://.../foto2.jpg'],
    required: false
  })
  @IsArray()
  @IsUrl({}, { each: true }) // Valida que cada elemento del array sea una URL
  @IsOptional()
  fotos?: string[];

  @ApiProperty({
    description: 'URL del video de demostración',
    example: 'https://youtube.com/watch?v=...',
    required: false
  })
  @IsUrl()
  @IsOptional()
  video?: string;

  @ApiProperty({
    description: 'Objeto que define las opciones del producto',
    example: { "Talla": ["S", "M", "G"], "Color": ["Rojo", "Azul"] },
    required: false
  })
  @IsObject()
  @IsOptional()
  opciones?: Record<string, any>;
  // ------------------------------------------
}