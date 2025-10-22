// src/products/DTO/update-product-dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product-dto';

// UpdateProductDto hereda todas las propiedades de CreateProductDto,
// pero las marca todas como opcionales.
export class UpdateProductDto extends PartialType(CreateProductDto) {}