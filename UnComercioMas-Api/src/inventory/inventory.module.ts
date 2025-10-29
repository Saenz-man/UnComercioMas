// src/inventory/inventory.module.ts

import { Module, forwardRef } from '@nestjs/common'; // 🛑 Importamos forwardRef
import { TypeOrmModule } from '@nestjs/typeorm';
import { BranchInventory } from './entities/inventario-sucursal.entity'; 

import { ProductsModule } from '../products/products.module';
import { BranchesModule } from '../branches/branches.module'; 

import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([BranchInventory]),
    // 🛑 Usamos forwardRef para romper la dependencia circular
    forwardRef(() => ProductsModule), 
    BranchesModule, 
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  
  // 🛑 EXPORTAMOS InventoryService para que ProductsModule pueda inyectarlo (IMPORTANTE)
  exports: [InventoryService, TypeOrmModule.forFeature([BranchInventory])],
})
export class InventoryModule {}