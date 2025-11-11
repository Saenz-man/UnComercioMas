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
import { ProductVariant } from './product-variant.entity';

@Entity({ name: 'productos' })
export class Product {
  
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  nombre: string;

  @Column({ 
    type: 'varchar', 
    length: 255,
    nullable: true // <-- ¡CAMBIO AQUÍ! Permite valores nulos
  })
  modelo: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.00 })
  precioPorPieza: number; 
  
  @Column({ type: 'jsonb', nullable: false, default: [] })
  fotos: string[];

  @Column({ type: 'text', nullable: true })
  video: string;

  @Column({ type: 'jsonb', nullable: false, default: {} })
  opciones: Record<string, any>;
  
  // --- Relaciones ---
  @ManyToOne(() => Category, (category: Category) => category.products, {
    nullable: false, 
    onDelete: 'RESTRICT' 
  })
  @JoinColumn({ name: 'categoria_id' }) 
  categoria: Category;
  
  @OneToMany(() => VolumePrice, (price: VolumePrice) => price.producto, {
    cascade: true, 
    eager: true    
  })
  preciosPorVolumen: VolumePrice[];
  
  @OneToMany(() => ProductVariant, (variant: ProductVariant) => variant.producto, {
    cascade: true,
    eager: false   
  })
  variantes: ProductVariant[];

  // --- Timestamps ---
  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}