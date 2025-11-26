import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm'; // <--- Nuevo
import { Repository } from 'typeorm'; // <--- Nuevo
import { UsersCoreService } from '../users/services/users-core.service';
import { Branch } from '../branches/entities/branch.entity'; // <--- Importar Entidad Branch
import { UserRole } from '../users/entities/user.entity';
import { RegisterDto } from '../auth/DTO/register.dto';
import { AssignBranchDto } from './DTO/assign-branch.dto';

// CORRECCIÓN: Eliminamos imports circulares y imports rotos a 'update-user.dto' si no existe aún.
// Definimos una interfaz temporal o 'any' para el update si no tienes el archivo todavía.
interface UpdateUserDto { activo?: boolean; nombre?: string; }

@Injectable()
export class AdminService { // <--- FALTABA LA PALABRA 'EXPORT'
  constructor(
    private readonly usersService: UsersCoreService,
    @InjectRepository(Branch)
    private readonly branchesRepository: Repository<Branch>,
  ) { }

  async createAdmin(dto: RegisterDto) { // Usamos RegisterDto por ahora
    const existing = await this.usersService.findUserByEmail(dto.email);
    if (existing) throw new ConflictException('El correo ya está registrado.');

    return this.usersService.registerNewUser({
      ...dto,
      rol: UserRole.ADMIN,
      activo: true,
    });
  }

  async createVendedor(dto: RegisterDto) {
    const existing = await this.usersService.findUserByEmail(dto.email);
    if (existing) throw new ConflictException('El correo ya está registrado.');

    return this.usersService.registerNewUser({
      ...dto,
      rol: UserRole.VENDEDOR,
      activo: true,
    });
  }

  async findAllVendedores() {
    return this.usersService.findUsersByRole(UserRole.VENDEDOR);
  }

  async removeVendedor(id: string) {
    const user = await this.usersService.findById(id);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    // Cast a 'any' temporalmente si updateUser espera un tipo estricto que no tenemos
    return this.usersService.updateUser(id, { activo: false } as any);
  }

  async updateVendedor(id: string, dto: UpdateUserDto) {
    const user = await this.usersService.findById(id);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return this.usersService.updateUser(id, dto as any);
  }

  // 6. LÓGICA PARA ASIGNAR SUCURSAL
  async assignBranch(dto: AssignBranchDto) {
    // 1. Buscar y validar la existencia del vendedor
    const vendedor = await this.usersService.findById(dto.vendedorId);
    if (!vendedor) {
      throw new NotFoundException('Vendedor no encontrado.');
    }

    // 2. Validar que el usuario sea efectivamente un VENDEDOR
    if (vendedor.rol !== UserRole.VENDEDOR) {
      throw new ConflictException('El usuario no tiene rol de Vendedor. No puede ser asignado a una sucursal.');
    }

    // 3. Validar que la Sucursal exista en la BD
    const sucursal = await this.branchesRepository.findOne({
      where: { id: dto.sucursalId }
    });
    if (!sucursal) {
      throw new NotFoundException(`La sucursal con ID ${dto.sucursalId} no existe.`);
    }

    // 4. Crear los nuevos detalles de asignación
    // Guardamos la nueva fecha:
    const fechaActual = new Date();

    return this.usersService.updateUser(vendedor.id, {
      // 1. Asignar el objeto Branch (Foreign Key)
      sucursal: sucursal,

      // 2. Asignar la fecha al nuevo campo escalar
      fecha_asignacion: fechaActual,

      // 3. Limpiar el JSONB (solo dejamos el objeto vacío)
      detalles_vendedor: {}
    });
  }

}