// src/products/entities/product-variant.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany // <-- 1. IMPORTAR ONETOMANY
} from 'typeorm';
import { Product } from './product.entity'; // Importamos el Producto "Padre"
import { BranchInventory } from '../../inventory/entities/inventario-sucursal.entity'; // <-- 2. IMPORTAR LA NUEVA ENTIDAD DE INVENTARIO

@Entity({ name: 'product_variants' })
// Creamos un índice para buscar variantes por producto y SKU rápidamente
@Index(['producto', 'sku'], { unique: true })
export class ProductVariant {
  
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // --- Relación con el Producto "Padre" ---
  @ManyToOne(() => Product, (product) => product.variantes, {
    nullable: false,
    onDelete: 'CASCADE', // Si se borra el Producto (Camiseta), se borran sus variantes.
  })
  @JoinColumn({ name: 'producto_id' })
  producto: Product;

  // --- Campos que MOVIMOS del Padre a la Variante ---
  @Column({
    type: 'varchar',
    length: 100,
    comment: 'El SKU único de esta variante (ej: 01010101)',
  })
  sku: string;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Inventario físico de esta variante específica',
  })
  stock: number;
  // ---------------------------------------------------

  @Column({
    type: 'jsonb',
    comment: 'Define esta variante (ej: {"Talla": "S", "Color": "Rojo"})',
  })
  atributos: Record<string, string>; // Lo forzamos a string:string por simplicidad

  @Column({
    type: 'text',
    nullable: true,
    comment: 'URL de la foto específica para esta variante (ej: camiseta roja)',
  })
  foto_variante: string;

  // --- 3. AÑADIR NUEVA RELACIÓN ---
  // Una variante (SKU) puede tener muchas entradas de inventario (una por sucursal)
  @OneToMany(() => BranchInventory, (inventory) => inventory.variante)
  inventario: BranchInventory[];
}