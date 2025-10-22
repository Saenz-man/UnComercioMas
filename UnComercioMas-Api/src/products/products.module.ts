// src/products/products.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// --- 1. Importar LAS TRES entidades ---
import { Product } from './entities/product.entity'; 
import { VolumePrice } from './entities/volume-price.entity';
import { ProductVariant } from './entities/product-variant.entity'; // <-- ¡ASÍ DEBE SER!
import { CategoriesModule } from '../categories/categories.module';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [
    // --- 2. Registrar LAS TRES entidades ---
    TypeOrmModule.forFeature([
      Product, 
      VolumePrice, 
      ProductVariant // <-- AÑADIR ESTA LÍNEA
    ]),
    
    CategoriesModule, 
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService]
})
export class ProductsModule {}