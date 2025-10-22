// src/branches/branches.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm'; // <-- Importar Not
import { Branch } from './entities/branch.entity';
import { CreateBranchDto } from './DTO/create-branch.dto';
import { UpdateBranchDto } from './DTO/update-branch.dto';

@Injectable()
export class BranchesService {
  constructor(
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
  ) {}

  /**
   * Lógica para asegurar que solo una sucursal sea la matriz.
   * Si 'es_matriz' es true, pone todas las demás en 'false'.
   * @param {string} [excludeId] - El ID de la sucursal actual (para no ponerla en false)
   */
  private async handleMatrixStatus(excludeId?: string): Promise<void> {
    const whereCondition: any = { es_matriz: true };
    if (excludeId) {
      whereCondition.id = Not(excludeId);
    }
    
    await this.branchRepository.update(whereCondition, {
      es_matriz: false,
    });
  }

  // --- CREAR (POST) ---
  async create(createDto: CreateBranchDto): Promise<Branch> {
    // Si esta nueva sucursal será la matriz...
    if (createDto.es_matriz) {
      // ...quitamos la bandera de cualquier otra que la tuviera.
      await this.handleMatrixStatus();
    }

    const newBranch = this.branchRepository.create(createDto);
    return this.branchRepository.save(newBranch);
  }

  // --- LEER TODOS (GET) ---
  async findAll(): Promise<Branch[]> {
    return this.branchRepository.find({
      order: {
        es_matriz: 'DESC', // Opcional: Pone la matriz primero
        nombre: 'ASC',
      },
    });
  }

  // --- LEER UNO (GET /:id) ---
  async findOne(id: string): Promise<Branch> {
    const branch = await this.branchRepository.findOneBy({ id });
    if (!branch) {
      throw new NotFoundException(`Sucursal con ID "${id}" no encontrada.`);
    }
    return branch;
  }

  // --- ACTUALIZAR (PATCH /:id) ---
  async update(id: string, updateDto: UpdateBranchDto): Promise<Branch> {
    // Si esta actualización la convertirá en matriz...
    if (updateDto.es_matriz) {
      // ...quitamos la bandera de cualquier otra.
      await this.handleMatrixStatus(id);
    }

    // Preload fusiona la entidad existente con los nuevos datos
    const branch = await this.branchRepository.preload({
      id: id,
      ...updateDto,
    });

    if (!branch) {
      throw new NotFoundException(`Sucursal con ID "${id}" no encontrada.`);
    }

    return this.branchRepository.save(branch);
  }

  // --- ELIMINAR (DELETE /:id) ---
  async remove(id: string): Promise<void> {
    const result = await this.branchRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Sucursal con ID "${id}" no encontrada.`);
    }
  }
}