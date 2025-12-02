import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
    UpdateDateColumn, ManyToOne, JoinColumn, OneToMany
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { OrderItem } from './item-pedido.entity';

export enum OrderStatus {
    PENDIENTE = 'PENDIENTE',
    COMPLETADA = 'COMPLETADA', // Venta cerrada (POS)
    CANCELADA = 'CANCELADA',
}

export enum PaymentMethod {
    EFECTIVO = 'EFECTIVO',
    TARJETA = 'TARJETA',
    TRANSFERENCIA = 'TRANSFERENCIA',
}

@Entity('orders')
export class Order {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // --- RELACIONES CLAVE ---

    // 1. ¿Quién vendió? (El usuario logueado en el POS)
    @ManyToOne(() => User, { nullable: false, eager: true })
    @JoinColumn({ name: 'vendedor_id' })
    vendedor: User;

    // 2. ¿En qué sucursal? (Contexto del vendedor)
    @ManyToOne(() => Branch, { nullable: false, eager: true })
    @JoinColumn({ name: 'sucursal_id' })
    sucursal: Branch;

    // 3. ¿A quién? (Opcional, puede ser venta a público general)
    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'cliente_id' })
    cliente: User;

    // 4. Detalle de productos
    @OneToMany(() => OrderItem, (item) => item.orden, { cascade: true })
    items: OrderItem[];

    // --- DATOS FINANCIEROS ---

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    total: number;

    @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.COMPLETADA })
    estatus: OrderStatus;

    @Column({ type: 'enum', enum: PaymentMethod, default: PaymentMethod.EFECTIVO })
    metodo_pago: PaymentMethod;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}