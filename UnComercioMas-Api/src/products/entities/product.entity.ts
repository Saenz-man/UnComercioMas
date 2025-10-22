// src/products/entities/product.entity.ts
import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn, 
  ManyToOne,
  JoinColumn,
  OneToMany
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { VolumePrice } from './volume-price.entity';
// 1. Importaremos la (futura) entidad de Variantes
import { ProductVariant } from './product-variant.entity'; 

@Entity({ name: 'productos' }) // Nombre de la tabla
export class Product {
  
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  nombre: string; // Ej: "Camiseta Olimpica"

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ 
    type: 'decimal', 
    precision: 10, // Total de dígitos
    scale: 2,       // Dígitos después del punto
    default: 0.00 
  })
  precio_base: number; // Este es tu precio "Menudeo"
  
  // --- CAMPO 'sku' ELIMINADO ---
  // (Ahora pertenece a la Variante)

  // --- CAMPO 'stock' ELIMINADO ---
  // (Ahora pertenece a la Variante)

  // --- NUEVOS CAMPOS (Refactor S2.5) ---
  @Column({
    type: 'jsonb',
    nullable: false,
    default: [],
    comment: 'Galería de fotos principales (array de URLs)'
  })
  fotos: string[];

  @Column({
    type: 'text',
    nullable: true,
    comment: 'URL del video de demostración'
  })
  video: string;

  @Column({
    type: 'jsonb',
    nullable: false,
    default: {},
    comment: 'Define las opciones (ej: {"Talla": ["S", "M"], "Color": ["Rojo"]})'
  })
  opciones: Record<string, any>;
  // --- FIN DE NUEVOS CAMPOS ---


  // --- Relación con Categorías (Se queda igual) ---
  @ManyToOne(() => Category, (category) => category.products, { 
    nullable: false, 
    onDelete: 'RESTRICT' 
  })
  @JoinColumn({ name: 'categoria_id' }) 
  categoria: Category;
  
  // --- Relación Precios por Volumen (S2.4) (Se queda igual) ---
  @OneToMany(() => VolumePrice, (price) => price.producto, { 
    cascade: true, 
    eager: true    // Esto está bien, un producto no tendrá miles de precios
  })
  preciosPorVolumen: VolumePrice[];
  
  // --- NUEVA RELACIÓN (S2.6) ---
  // Un producto "Padre" tiene MUCHAS "Variantes" (SKUs)
  @OneToMany(() => ProductVariant, (variant) => variant.producto, {
    cascade: true, // Si se guarda el producto, se guardan las variantes
    eager: false   // ¡Importante! No queremos cargar cientos de variantes por defecto
  })
  variantes: ProductVariant[];
  // --- FIN DE NUEVA RELACIÓN ---

  
  // --- Timestamps (Se quedan igual) ---
  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}