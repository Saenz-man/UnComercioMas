import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsUUID,
  IsOptional,
  IsPositive,
  IsArray,
  ValidateNested, // <-- Importante para validar el array de variantes
  IsUrl,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateProductVariantDto } from './create-product-variant.dto'; // <-- IMPORTANTE

// --- DTO Anidado para Precios por Volumen (Corregido con mensajes) ---
class CreateVolumePriceDto {
  @ApiProperty({ description: 'Cantidad mínima', example: 10 })
  @IsPositive({
    message: 'La cantidad mínima por volumen debe ser un número positivo',
  })
  cantidad_minima: number;

  @ApiProperty({ description: 'Precio para esta cantidad', example: 80 })
  @IsPositive({
    message: 'El precio por volumen debe ser mayor a $0.0',
  })
  precio: number;
}
// -----------------------------------------------------------------

export class CreateProductDto {
  // --- Datos del Producto Padre ---
  @ApiProperty({ description: 'Nombre', example: 'Playera Brush Manga Corta' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  // --- ¡CAMBIO AQUÍ! ---
  @ApiProperty({
    description: 'Modelo',
    example: 'Hombre',
    required: false, // <-- Se marca como opcional
  })
  @IsString()
  @IsOptional() // <-- Se cambia IsNotEmpty por IsOptional
  modelo?: string; // Se añade '?' para indicar que es opcional
  // --- FIN DEL CAMBIO ---

  @ApiProperty({ description: 'Descripción', required: false })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiProperty({ description: 'Precio por pieza (menudeo)', example: 100 })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El precio debe ser un número con máximo 2 decimales.' },
  )
  @IsPositive({
    message: 'El valor del producto debe ser mayor a $0.0', // <--- AQUÍ ESTÁ LA CORRECCIÓN
  })
  precioPorPieza: number;

  @ApiProperty({ description: 'ID de la categoría' })
  @IsUUID()
  @IsNotEmpty()
  categoria_id: string;

  // REQUISITO: Precios por distribuidor (se queda igual)
  @ApiProperty({ type: [CreateVolumePriceDto], required: false })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateVolumePriceDto)
  preciosPorVolumen?: CreateVolumePriceDto[];

  // REQUISITO: Foto genérica del padre
  @ApiProperty({
    description: 'Fotos genéricas del producto padre',
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  fotos?: string[];

  // REQUISITO: Video del padre
  @ApiProperty({ description: 'Video del producto padre', required: false })
  @IsString()
  @IsOptional()
  video?: string;

  // REQUISITO: Opciones (Tallas, Colores)
  @ApiProperty({
    description: 'Define las opciones disponibles',
    example: { Talla: ['CH', 'M', 'G'], Color: ['Blanco', 'Negro'] },
  })
  @IsObject()
  @IsNotEmpty() // Hacemos que sea obligatorio definir opciones
  opciones: Record<string, string[]>; // <-- Debe ser string[]

  // --- REQUISITO CLAVE: Array de SKUs (Hijos) ---
  @ApiProperty({
    description: 'Array de todas las variantes (SKUs) del producto',
    type: [CreateProductVariantDto],
  })
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true }) // <-- Valida cada objeto del array
  @Type(() => CreateProductVariantDto) // <-- Usa el DTO de variante
  variantes: CreateProductVariantDto[];
  // --- FIN DE LA MODIFICACIÓN ---

  @ApiProperty({
    description: 'Slug',
    example: 'playera-brush-manga-corta',
    required: false,
  })
  @IsString()
  @IsOptional()
  slug?: string;
}
