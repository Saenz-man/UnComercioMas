import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from './pedido.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';

@Entity('order_items')
export class OrderItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // Relación con la Orden Padre
    @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'order_id' })
    orden: Order;

    // Relación con el Producto (Variante)
    @ManyToOne(() => ProductVariant, { eager: true })
    @JoinColumn({ name: 'variante_id' })
    variante: ProductVariant;

    @Column({ type: 'int' })
    cantidad: number;

    // Guardamos el precio al momento de la venta (Snapshot)
    // por si el producto cambia de precio en el futuro.
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    precio_unitario: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    subtotal: number;
}