// src/products/entities/volume-price.entity.ts
import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { Product } from './product.entity'; // Importamos el producto

@Entity({ name: 'precios_volumen' })
export class VolumePrice {
  
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ 
    type: 'int',
    comment: 'Cantidad mínima para aplicar este precio' 
  })
  cantidad_minima: number;

  @Column({ 
    type: 'decimal', 
    precision: 10, 
    scale: 2 
  })
  precio: number;

  // --- Relación con Producto ---
  // Muchos precios por volumen pertenecen a Un Producto
  @ManyToOne(() => Product, (product) => product.preciosPorVolumen, { 
    onDelete: 'CASCADE' // <-- ¡Importante! Si se borra el producto, se borran sus precios.
  })
  @JoinColumn({ name: 'producto_id' }) // Nombre de la columna FK
  producto: Product;
}