import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BranchInventory } from './entities/inventario-sucursal.entity'; 

import { ProductsModule } from '../products/products.module';
import { BranchesModule } from '../branches/branches.module'; // <-- (Importado)

import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([BranchInventory]),
    ProductsModule,
    BranchesModule, // <-- (Añadido a 'imports')
  ],
  controllers: [InventoryController],
  providers: [InventoryService]
})
export class InventoryModule {}