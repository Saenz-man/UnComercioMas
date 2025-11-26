import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Branch } from './entities/branch.entity';
import { CreateBranchDto } from './DTO/create-branch.dto';
import { UpdateBranchDto } from './DTO/update-branch.dto';

@Injectable()
export class BranchesService {
  constructor(
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
  ) { }

  // --- Manejo de Errores Privado ---
  private handleDBErrors(error: any): never {
    // Código de error de Postgres para "Unique Violation"
    if (error.code === '23505') {
      throw new ConflictException('Ya existe una sucursal con ese nombre');
    }
    console.error(error);
    throw new InternalServerErrorException('Error en el servidor al procesar la sucursal');
  }

  /**
   * Lógica para asegurar que solo una sucursal sea la matriz.
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
    if (createDto.es_matriz) {
      await this.handleMatrixStatus();
    }

    // INTEGRACIÓN DEL MANEJO DE ERRORES AQUÍ
    try {
      const newBranch = this.branchRepository.create(createDto);
      return await this.branchRepository.save(newBranch);
    } catch (error) {
      this.handleDBErrors(error); // Llama al manejador
    }
  }

  // --- LEER TODOS (GET) ---
  async findAll(): Promise<Branch[]> {
    return this.branchRepository.find({
      order: {
        es_matriz: 'DESC',
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
    if (updateDto.es_matriz) {
      await this.handleMatrixStatus(id);
    }

    const branch = await this.branchRepository.preload({
      id: id,
      ...updateDto,
    });

    if (!branch) {
      throw new NotFoundException(`Sucursal con ID "${id}" no encontrada.`);
    }

    // INTEGRACIÓN DEL MANEJO DE ERRORES AQUÍ
    try {
      return this.branchRepository.save(branch);
    } catch (error) {
      this.handleDBErrors(error); // Llama al manejador
    }
  }

  // --- ELIMINAR (DELETE /:id) ---
  async remove(id: string): Promise<void> {
    const result = await this.branchRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Sucursal con ID "${id}" no encontrada.`);
    }
  }

  // 🟢 MÉTODO NUEVO PARA ENCONTRAR LA MATRIZ
  async findMatriz(): Promise<Branch> {
    const matriz = await this.branchRepository.findOneBy({ es_matriz: true });

    if (!matriz) {
      throw new NotFoundException('No se encontró ninguna sucursal marcada como Matriz.');
    }
    return matriz;
  }
}