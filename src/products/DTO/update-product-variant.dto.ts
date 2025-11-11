// src/products/DTO/update-product-variant.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateProductVariantDto } from './create-product-variant.dto';

// Hace que todos los campos (sku, stock, atributos, etc.) sean opcionales
export class UpdateProductVariantDto extends PartialType(CreateProductVariantDto) {}