import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

// Entidades que usa este módulo
import { Order } from './entities/pedido.entity';
import { OrderItem } from './entities/item-pedido.entity';

// Módulos externos que necesitamos
import { InventoryModule } from '../inventory/inventory.module';
import { UsersModule } from '../users/users.module'; // Importante para validar al vendedor

@Module({
  imports: [
    // 1. Registramos las entidades para que funcionen los @InjectRepository
    TypeOrmModule.forFeature([Order, OrderItem]),
    InventoryModule,
    UsersModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService] // Buena práctica por si alguien más necesita crear órdenes
})
export class OrdersModule { }
