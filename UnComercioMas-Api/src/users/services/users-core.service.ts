import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

// Asegúrate que estas importaciones apunten a tus archivos reales
import { User, UserRole } from '../entities/user.entity';
import { RegisterDto } from '../../auth/dto/register.dto';

@Injectable()
export class UsersCoreService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  // --- A. BÚSQUEDAS ---

  // Busca por email (útil para login y validaciones)
  async findUserByEmail(email: string, withPassword = false): Promise<User | null> {
    const query = this.userRepository.createQueryBuilder('user')
      .where('user.email = :email', { email });

    if (withPassword) {
      query.addSelect('user.hash_contrasena'); // Traemos el hash solo si se pide explícitamente
    }

    return query.getOne();
  }

  // Busca por ID (útil para Guards y actualizaciones)
  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  // Busca por Rol (útil para el AdminController)
  async findUsersByRole(role: UserRole): Promise<User[]> {
    return this.userRepository.find({
      where: { rol: role, activo: true },
      // CORRECCIÓN: Usamos solo las columnas que SÍ existen en tu entity
      select: {
        id: true,
        email: true,
        rol: true,
        activo: true,
        fecha_creacion: true, // Corregido: creado_en -> fecha_creacion
        // nombre: true, <--- ELIMINADO: Tu entidad no tiene 'nombre'
      }
    });
  }

  // --- B. CREACIÓN ---

  // Método público para Registro de Clientes (usado por AuthController)
  async registerNewClient(dto: RegisterDto): Promise<User> {
    return this.registerNewUser({
      ...dto,
      rol: UserRole.CLIENTE,
      activo: true,
    });
  }

  // Método MAESTRO de creación (usado por AdminService y el método de arriba)
  // Aceptamos un objeto que combine los datos del usuario + el password plano
  async registerNewUser(userData: Partial<User> & { password?: string }): Promise<User> {
    const { password, ...rest } = userData;

    // 1. Encriptamos la contraseña aquí mismo para no repetir código
    let hashedPassword = '';
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // 2. Creamos la instancia
    // Pasamos el password plano al campo 'hash_contrasena'.
    // Tu entidad User tiene un @BeforeInsert que detectará esto y lo encriptará.
    const newUser = this.userRepository.create({
      ...rest,
      hash_contrasena: password, // Pasamos texto plano para que el Hook lo encripte
      activo: rest.activo ?? true,
    });

    // 3. Guardamos
    return this.userRepository.save(newUser);
  }

  // --- C. ACTUALIZACIÓN ---

  async updateUser(id: string, changes: Partial<User>): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    // Nota: Si en el futuro permites actualizar contraseña aquí,
    // recuerda agregar la lógica de bcrypt antes del merge.

    this.userRepository.merge(user, changes);
    return this.userRepository.save(user);
  }
}