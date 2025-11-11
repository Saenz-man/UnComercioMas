// src/inventory/entities/branch-inventory.entity.ts
import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  JoinColumn,
  Unique // <-- Importar
} from 'typeorm';
import { Branch } from '../../branches/entities/branch.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';

@Entity({ name: 'inventario_sucursal' })
// ¡Importante! Un SKU solo puede tener UNA fila de stock por sucursal.
@Unique(['sucursal', 'variante']) 
export class BranchInventory {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', default: 0 })
  stock: number;

  // --- Relación con Sucursal ---
  @ManyToOne(() => Branch, (branch) => branch.inventario, { 
    nullable: false, 
    onDelete: 'CASCADE' // Si se borra la sucursal, se borra su inventario
  })
  @JoinColumn({ name: 'sucursal_id' })
  sucursal: Branch;

  // --- Relación con Variante (SKU) ---
  @ManyToOne(() => ProductVariant, (variant) => variant.inventario, { 
    nullable: false, 
    onDelete: 'CASCADE' // Si se borra el SKU, se borra su inventario
  })
  @JoinColumn({ name: 'variante_id' })
  variante: ProductVariant;
}