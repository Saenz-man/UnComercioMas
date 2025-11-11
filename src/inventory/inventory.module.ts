// src/inventory/inventory.module.ts

import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// 1. Importa las 3 entidades que usaremos en el servicio
import { BranchInventory } from './entities/inventario-sucursal.entity';
// ✅ CORREGIDO: Quitado el punto extra al final
import { Transfer } from './entities/transferencia-inventario.entity'; 
import { ProductVariant } from '../products/entities/product-variant.entity';
import { Branch } from '../branches/entities/branch.entity';

// 2. Importa los módulos (como ya lo tenías)
import { ProductsModule } from '../products/products.module';
import { BranchesModule } from '../branches/branches.module';

import { InventoryService } from './inventory.service';
// ✅ CORREGIDO: La ruta debe ser relativa (con './')
import { InventoryController } from './inventory.controller';

@Module({
  imports: [
    // 3. Registra las 4 entidades en el TypeOrmModule
    TypeOrmModule.forFeature([
      BranchInventory,
      Transfer,
      ProductVariant,
      Branch,
    ]),
    forwardRef(() => ProductsModule),
    BranchesModule,
  ],
  controllers: [InventoryController],
  providers: [InventoryService],

  // 4. Exporta la nueva entidad también (buena práctica)
  exports: [
    InventoryService,
    TypeOrmModule.forFeature([BranchInventory, Transfer]),
  ],
})
export class InventoryModule {}