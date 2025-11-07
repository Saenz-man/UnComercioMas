// src/products/DTO/create-product-variant.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsUUID,
  IsOptional,
  IsPositive, // Mantenemos este para 'cantidad_minima'
  Min,        // <-- ¡IMPORTANTE! Importamos Min
  IsArray,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

// ======================================================
// === DTO ANIDADO: Precio por Volumen ===
// ======================================================
class CreateVolumePriceDto {
  @ApiProperty({
    description: 'Cantidad mínima requerida para aplicar este precio',
    example: 10,
  })
  @IsPositive({ message: 'La cantidad mínima debe ser un número positivo.' })
  cantidad_minima: number; // <-- 'cantidad_minima' sí debe ser > 0

  @ApiProperty({
    description: 'Precio unitario para esta cantidad mínima',
    example: 80,
  })
  // --- CORRECCIÓN 1 ---
  @Min(0, { message: 'El precio por volumen no puede ser negativo.' })
  precio: number;
}

// ======================================================
// === DTO ANIDADO: Variante (SKU) ===
// ======================================================
export class CreateProductVariantDto {
  @ApiProperty({
    description: 'SKU único de la variante (identificador del producto hijo)',
    example: 'PLAYERA-BRUSH-H-CH-BLANCO',
  })
  @IsString()
  @IsNotEmpty({ message: 'El SKU es obligatorio.' })
  sku: string;

  @ApiProperty({
    description: 'Cantidad de stock disponible para la variante',
    example: 50,
  })
  @IsNumber({}, { message: 'El stock debe ser un número.' })
  // --- CORRECCIÓN 2 (La principal que reportaste) ---
  @Min(0, { message: 'El stock no puede ser negativo (puede ser 0).' })
  stock: number;

  @ApiProperty({
    description: 'URL de la foto específica de esta variante',
    example: 'https://cdn.miapp.com/img/playera-blanca-ch.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  foto?: string;

  @ApiProperty({
    description:
      'Opciones aplicadas a esta variante. Las claves son dinámicas (ej. Talla, Color, Material, etc.)',
    example: {
      Talla: 'CH',
      Color: 'Blanco',
    },
  })
  @IsObject({ message: 'Las opciones deben ser un objeto válido.' })
  @IsNotEmpty({ message: 'Cada variante debe tener al menos una opción.' })
  opciones: Record<string, string>;

  @ApiProperty({
    description:
      'Precio específico de esta variante (si es distinto del precio base)',
    example: 0,
    required: false,
  })
  @IsNumber({}, { message: 'El precio debe ser un número.' })
  // --- CORRECCIÓN 3 (Proactiva) ---
  @Min(0, { message: 'El precio de la variante no puede ser negativo.' })
  @IsOptional()
  precio?: number;
}

// ======================================================
// === DTO PRINCIPAL: Producto Padre ===
// ======================================================
export class CreateProductDto {
  // --- Datos básicos ---
  @ApiProperty({
    description: 'Nombre del producto',
    example: 'Playera Brush Manga Corta',
  })
  @IsString()
  @IsNotEmpty({ message: 'El nombre del producto es obligatorio.' })
  nombre: string;

  // ... (modelo, descripcion, categoria_id no cambian) ...
  @ApiProperty({
    description: 'Modelo del producto (opcional)',
    example: 'Hombre',
    required: false,
  })
  @IsString()
  @IsOptional()
  modelo?: string;

  @ApiProperty({
    description: 'Descripción del producto',
    example: 'Playera de algodón con diseño brush',
    required: false,
  })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiProperty({
    description: 'Precio unitario por pieza (menudeo)',
    example: 100.0,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El precio debe tener máximo 2 decimales.' },
  )
  // --- CORRECCIÓN 4 ---
  @Min(0, { message: 'El precio no puede ser negativo.' })
  precioPorPieza: number;

  @ApiProperty({
    description: 'ID de la categoría del producto',
    example: '9b7e1e6d-7b0b-4a2b-bf83-54f2a2a53b3f',
  })
  @IsUUID('4', { message: 'El ID de la categoría debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'El campo categoría es obligatorio.' })
  categoria_id: string;

  // --- Precios por volumen ---
  @ApiProperty({
    description: 'Lista de precios por volumen',
    type: [CreateVolumePriceDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVolumePriceDto)
  @IsOptional()
  preciosPorVolumen?: CreateVolumePriceDto[];

  // ... (fotos, video, opciones no cambian) ...
  @ApiProperty({
    description: 'Fotos del producto principal',
    example: [
      'https://cdn.miapp.com/img/playera-1.jpg',
      'https://cdn.miapp.com/img/playera-2.jpg',
    ],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  fotos?: string[];

  @ApiProperty({
    description: 'Video promocional o demostrativo del producto',
    example: 'https://cdn.miapp.com/videos/playera.mp4',
    required: false,
  })
  @IsString()
  @IsOptional()
  video?: string;

  @ApiProperty({
    description:
      'Opciones disponibles del producto. Las claves son dinámicas (por ejemplo: Talla, Color, Material...)',
    example: {
      Talla: ['CH', 'M', 'G'],
      Color: ['Blanco', 'Negro'],
      Material: ['Algodón', 'Poliéster'],
    },
  })
  @IsObject({ message: 'Las opciones deben ser un objeto válido.' })
  @IsNotEmpty({
    message: 'Debes definir al menos una opción con sus valores posibles.',
  })
  opciones: Record<string, string[]>;

  // --- Variantes dinámicas ---
  @ApiProperty({
    description:
      'Lista de variantes (SKUs) del producto. Cada variante puede tener sus propias combinaciones de opciones.',
    type: [CreateProductVariantDto],
  })
  @IsArray({ message: 'Las variantes deben ser un arreglo.' })
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariantDto)
  @IsNotEmpty({ message: 'Debes incluir al menos una variante del producto.' })
  variantes: CreateProductVariantDto[];

  // --- Slug (opcional, autogenerado si no se envía) ---
  @ApiProperty({
    description: 'Slug único del producto (autogenerado si no se envía)',
    example: 'playera-brush-manga-corta',
    required: false,
  })
  @IsString()
  @IsOptional()
  slug?: string;
}