import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Product } from '../../products/entities/product.entity'; 

@Entity('categorias')
export class Category {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'text', unique: true })
    nombre: string;

    @Column({ type: 'text', unique: true })
    slug: string; // Para URLs amigables

    // Relación jerárquica
    @Column({ type: 'uuid', nullable: true, name: 'id_padre' })
    id_padre: string | null;

    // Relación ManyToOne: Una categoría tiene un padre
    @ManyToOne(() => Category, category => category.children, { onDelete: 'SET NULL' })
    parent: Category | null;

    // Relación OneToMany: Una categoría padre tiene muchos hijos
    @OneToMany(() => Category, category => category.parent)
    children: Category[]; // <-- CORRECCIÓN: Se elimina "= []"

    @OneToMany(() => Product, (product) => product.categoria)
     products: Product[]; // <-- 2. AÑADIR ESTA LÍNEA


}
