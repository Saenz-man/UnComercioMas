// src/inventory/entities/transferencia-inventario.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Branch } from '../../branches/entities/branch.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';

@Entity({ name: 'transferencias_inventario' })
export class Transfer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // --- Relación con la Variante (SKU) ---
  @ManyToOne(() => ProductVariant, { nullable: false, eager: true })
  @JoinColumn({ name: 'variante_id' })
  variante: ProductVariant;

  // --- Relación con la Sucursal de Origen ---
  @ManyToOne(() => Branch, { nullable: false, eager: true })
  @JoinColumn({ name: 'source_branch_id' })
  sourceBranch: Branch;

  // --- Relación con la Sucursal de Destino ---
  @ManyToOne(() => Branch, { nullable: false, eager: true })
  @JoinColumn({ name: 'destination_branch_id' })
  destinationBranch: Branch;

  @Column({ type: 'int' })
  quantity: number;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;
}