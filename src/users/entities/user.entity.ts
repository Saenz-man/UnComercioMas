// src/users/entities/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert, BeforeUpdate, ManyToOne, JoinColumn } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Branch } from 'src/branches/entities/branch.entity';

// Definición de Roles (para mayor seguridad y claridad)
export enum UserRole {
  CLIENTE = 'cliente',
  VENDEDOR = 'vendedor',
  ADMIN = 'admin',
  SUPERADMIN = 'superadmin',
}

@Entity('usuarios') // Nombre de la tabla en PostgreSQL
export class User {
  @PrimaryGeneratedColumn('uuid') // Usamos UUID para IDs de usuario
  id: string;

  @Column({ type: 'text', unique: true })
  email: string;

  @Column({ type: 'text', select: false, nullable: true }) // No seleccionar por defecto, puede ser nulo si es social login
  hash_contrasena: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CLIENTE,
  })
  rol: UserRole;

  // Campos para autenticación social (opcional)
  @Column({ type: 'text', nullable: true })
  proveedor_oauth: string;

  @Column({ type: 'text', nullable: true })
  id_proveedor_oauth: string;

  // Datos específicos del vendedor (JSONB)
  // @Column({ type: 'jsonb', nullable: true, default: {} })
  // detalles_vendedor: any;

  // --- NUEVA RELACIÓN NORMALIZADA ---
  @ManyToOne(() => Branch, { nullable: true, eager: true }) // eager: true para cargar la sucursal al leer el usuario
  @JoinColumn({ name: 'sucursal_id' }) // ESTO crea la columna 'sucursal_id' en la tabla 'usuarios'
  sucursal: Branch;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  // MÉTODOS HOOK PARA HASHEO DE CONTRASEÑA
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.hash_contrasena) {
      const salt = await bcrypt.genSalt();
      this.hash_contrasena = await bcrypt.hash(this.hash_contrasena, salt);
    }
  }

  // --- Otros campos de auditoría ---
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha_creacion: Date;

  @Column({ type: 'timestamp', nullable: true })
  fecha_asignacion: Date; // <-- Nueva columna escalar para la fecha

  @Column({ type: 'jsonb', nullable: true, default: {} })
  detalles_vendedor: any; // <-- Lo mantenemos para flexibilidad futura, pero ahora está vacío.
}