// src/products/products.module.ts
import { Module, forwardRef } from '@nestjs/common'; // 🛑 Importamos forwardRef
import { TypeOrmModule } from '@nestjs/typeorm';

// --- Imports de Módulos (Obligatorios para resolver dependencias) ---
import { CategoriesModule } from '../categories/categories.module'; 
import { BranchesModule } from '../branches/branches.module';     
import { InventoryModule } from '../inventory/inventory.module'; // 🛑 Dependencia circular

// --- Imports de Productos ---
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './entities/product.entity';

// --- Imports de Entidades ---
import { ProductVariant } from './entities/product-variant.entity'; 
import { VolumePrice } from './entities/volume-price.entity';    
import { Attribute } from './entities/attribute.entity';          
import { AttributeValue } from './entities/attribute-value.entity';

// --- Imports de Attributes ---
import { AttributesService } from './attributes.service';        
import { AttributesController } from './attributes.controller';  


@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductVariant, 
      VolumePrice,    
      Attribute,      
      AttributeValue, 
    ]),
    CategoriesModule, 
    BranchesModule,
    // 🛑 USAMOS FORWARDREF: Rompe la dependencia circular
    forwardRef(() => InventoryModule), 
  ],
  controllers: [
    ProductsController,
    AttributesController, 
  ],
  providers: [
    ProductsService,    
    AttributesService,    
  ],
  // 🛑 EXPORTAMOS ProductsService y usamos forwardRef en la exportación para circularidad
  exports: [
    forwardRef(() => ProductsService), // Exportación ajustada
    TypeOrmModule.forFeature([ProductVariant]),
  ]
})
export class ProductsModule {}