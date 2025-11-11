// src/branches/entities/branch.entity.ts
import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
  OneToMany // <-- 1. AÑADIR ESTE IMPORT
} from 'typeorm';
// <-- 2. IMPORTAR TU NUEVA ENTIDAD DE INVENTARIO -->
// (Asegúrate de que la ruta sea correcta según tu estructura)
import { BranchInventory } from '../../inventory/entities/inventario-sucursal.entity'; 

@Entity({ name: 'sucursales' })
export class Branch {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  nombre: string; 

  @Column({ type: 'varchar', length: 255, nullable: true })
  direccion: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefono: string;

  @Column({ 
    type: 'boolean', 
    default: false,
    comment: 'Indica si esta es la sucursal matriz principal'
  })
  es_matriz: boolean;

  @Column({ type: 'varchar', length: 50, default: 'sucursal' })
  tipo: string; 

  // --- 3. AÑADIR LA RELACIÓN INVERSA ---
  // Una sucursal puede tener MUCHAS líneas de inventario (una por SKU)
  @OneToMany(() => BranchInventory, (inventory) => inventory.sucursal)
  inventario: BranchInventory[]; // <-- ESTA ES LA PROPIEDAD QUE FALTABA
  // --- FIN DEL CAMBIO ---

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}