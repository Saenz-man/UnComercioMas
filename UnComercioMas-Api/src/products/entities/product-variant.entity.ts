// src/products/entities/product-variant.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
  CreateDateColumn, // Opcional: si usas timestamps
  UpdateDateColumn, // Opcional: si usas timestamps
} from 'typeorm';
import { Product } from './product.entity';
import { BranchInventory } from '../../inventory/entities/inventario-sucursal.entity';

@Entity({ name: 'product_variants' }) // Nombre de la tabla en tu base de datos
@Index(['producto', 'sku'], { unique: true }) // Índice para asegurar SKU único por producto
export class ProductVariant {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  // --- Relación con el Producto Padre ---
  @ManyToOne(() => Product, (product) => product.variantes, {
    nullable: false, // Una variante siempre debe pertenecer a un producto
    onDelete: 'CASCADE', // Si se borra el producto, se borran sus variantes
  })
  @JoinColumn({ name: 'producto_id' }) // Nombre de la columna Foreign Key en la tabla product_variants
  producto: Product;

  // --- Campos Específicos de la Variante ---
  @Column({
    type: 'varchar',
    length: 100, // Ajusta la longitud si necesitas SKUs más largos
    unique: true, // Si el SKU debe ser único en toda la tabla (considera el índice compuesto de arriba)
    comment: 'El SKU único de esta variante',
  })
  sku: string;

  /**
   * NOTA: Este campo 'stock' parece redundante si ya manejas el inventario
   * por sucursal en la entidad 'BranchInventory'.
   * Podrías considerar quitarlo si no representa un "stock total" o "stock inicial".
   * Si lo dejas, asegúrate de mantenerlo sincronizado.
   */
  @Column({
    type: 'int',
    default: 0,
    comment: 'Stock total o inicial (considera si es necesario)',
  })
  stock: number;

  @Column({
    type: 'jsonb', // 'jsonb' es generalmente mejor en PostgreSQL que 'json'
    nullable: true, // Permite variantes sin atributos definidos?
    comment: 'Define atributos específicos (ej: {"Talla": "S", "Color": "Rojo"})',
  })
  atributos?: Record<string, string>; // Usamos 'atributos' como en tu código anterior

  // --- ¡CORRECCIÓN APLICADA AQUÍ! ---
  @Column({
    type: 'text', // 'text' permite URLs largas, 'varchar' también es opción
    nullable: true, // La foto es opcional
    comment: 'URL (ruta relativa) de la foto específica para esta variante',
    name: 'foto_variante' // <-- Mapea explícitamente al nombre de tu columna
  })
  foto_variante?: string; // <-- El nombre de la propiedad coincide con la BD y el mapeo
  // --- FIN DE LA CORRECCIÓN ---

  @Column({
    type: 'decimal',
    precision: 10, // Número total de dígitos
    scale: 2,      // Número de dígitos después del punto decimal
    nullable: true, // Permite que la variante use el precio del padre si es null
    comment: 'Precio específico de la variante (si difiere del padre)',
  })
  precio?: number;

  // --- Relación con el Inventario por Sucursal ---
  @OneToMany(() => BranchInventory, (inventory) => inventory.variante)
  inventario: BranchInventory[]; // Array de entradas de inventario para esta variante

  // --- Timestamps Opcionales ---
  /* Descomenta si tu tabla tiene estas columnas
  @CreateDateColumn({ name: 'created_at' }) // Mapea a la columna created_at
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' }) // Mapea a la columna updated_at
  updatedAt: Date;
  */
}