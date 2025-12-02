import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Order, OrderStatus } from './entities/pedido.entity';
import { OrderItem } from './entities/item-pedido.entity';
import { CreatePosOrderDto } from './DTO/create-pos-order.dto';

// Dependencias externas
import { User } from '../users/entities/user.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { InventoryService } from '../inventory/inventory.service';
import { BranchInventory } from '../inventory/entities/inventario-sucursal.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private readonly orderRepository: Repository<Order>,
    private readonly inventoryService: InventoryService, // Para validar stock
    private readonly dataSource: DataSource, // Para transacciones
  ) { }

  // --- POS: CREAR VENTA ---
  async createPosOrder(userToken: User, dto: CreatePosOrderDto) {

    // 1. RECARGAR USUARIO (Corrección)
    // Usamos el ID del token para buscar la versión completa en la BD con su sucursal.
    const userVendedor = await this.dataSource.getRepository(User).findOne({
      where: { id: userToken.id },
      relations: ['sucursal'], // <--- ¡Esto es lo importante! Forzamos la carga.
    });

    // 2. Validar que el vendedor tenga sucursal asignada
    if (!userVendedor || !userVendedor.sucursal) {
      throw new BadRequestException('El vendedor no tiene una sucursal asignada para realizar ventas.');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Repositorios dentro de la transacción
      const orderRepo = queryRunner.manager.getRepository(Order);
      const itemRepo = queryRunner.manager.getRepository(OrderItem);
      const variantRepo = queryRunner.manager.getRepository(ProductVariant);
      const invRepo = queryRunner.manager.getRepository(BranchInventory);

      // 2. Preparar la Orden (Cabecera)
      const newOrder = orderRepo.create({
        vendedor: userVendedor,
        sucursal: userVendedor.sucursal,
        metodo_pago: dto.metodo_pago,
        estatus: OrderStatus.COMPLETADA,
        total: 0, // Se calculará abajo
      });

      // (Opcional: Asignar cliente si viene en dto.cliente_id)

      const savedOrder = await orderRepo.save(newOrder);
      let totalOrden = 0;

      // 3. Procesar Items (Iterar carrito)
      for (const itemDto of dto.items) {
        // A. Obtener Producto y Precio
        const variant = await variantRepo.findOneBy({ id: itemDto.variante_id });
        if (!variant) throw new NotFoundException(`Producto ${itemDto.variante_id} no encontrado`);

        // B. Validar y Descontar Stock (Lógica pesimista)
        const inventoryEntry = await invRepo.findOne({
          where: {
            sucursal: { id: userVendedor.sucursal.id },
            variante: { id: variant.id }
          }
        });

        if (!inventoryEntry || inventoryEntry.stock < itemDto.cantidad) {
          throw new BadRequestException(`Stock insuficiente para ${variant.sku} en esta sucursal.`);
        }

        // Descontar
        inventoryEntry.stock -= itemDto.cantidad;
        await invRepo.save(inventoryEntry);

        // C. Crear OrderItem
        const subtotal = Number(variant.precio) * itemDto.cantidad;
        totalOrden += subtotal;

        const newItem = itemRepo.create({
          orden: savedOrder,
          variante: variant,
          cantidad: itemDto.cantidad,
          precio_unitario: variant.precio, // Snapshot del precio
          subtotal: subtotal,
        });
        await itemRepo.save(newItem);
      }

      // 4. Actualizar Total de la Orden
      savedOrder.total = totalOrden;
      await orderRepo.save(savedOrder);

      // 5. Commit
      await queryRunner.commitTransaction();

      return { message: 'Venta registrada con éxito', orderId: savedOrder.id, total: totalOrden };

    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // ... (tus otros métodos como findRecentOrders)
  async findRecentOrders(limit: number) {
    return this.orderRepository.find({
      take: limit,
      order: { created_at: 'DESC' },
      relations: ['vendedor', 'items', 'items.variante']
    });
  }
}