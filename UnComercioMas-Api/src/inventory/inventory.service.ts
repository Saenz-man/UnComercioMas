import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { BranchInventory } from './entities/inventario-sucursal.entity';
import { AssignStockDto } from './DTO/assign-stock.dto';
import { UpdateStockDto } from './DTO/update-stock.dto';

// Importamos los servicios/repositorios que necesitamos para validar
import { BranchesService } from '../branches/branches.service';
import { ProductsService } from '../products/products.service';

// --- NUEVAS IMPORTACIONES ---
import { TransferStockDto } from './DTO/transfer-stock.dto'; 
// --- CORRECCIÓN DE TIPEO (quitamos el '.' extra) ---
import { Transfer } from './entities/transferencia-inventario.entity'; 
import { ProductVariant } from '../products/entities/product-variant.entity'; 
import { Branch } from '../branches/entities/branch.entity'; 

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(BranchInventory)
    private readonly inventoryRepository: Repository<BranchInventory>,

    // --- NUEVAS INYECCIONES ---
    @InjectRepository(Transfer) 
    private readonly transferRepository: Repository<Transfer>,
    @InjectRepository(ProductVariant) 
    private readonly variantRepository: Repository<ProductVariant>,
    @InjectRepository(Branch) 
    private readonly branchRepository: Repository<Branch>,

    private readonly dataSource: DataSource,
    // --- FIN NUEVAS INYECCIONES ---

    private readonly branchesService: BranchesService,
    private readonly productsService: ProductsService,
  ) {}

  // ==================================================================
  // ✅ NUEVO MÉTODO DE TRANSFERENCIA DE STOCK (TRANSACCIONAL)
  // ==================================================================
  async transferStock(transferDto: TransferStockDto): Promise<Transfer> {
    const {
      source_branch_id,
      destination_branch_id,
      variante_id,
      quantity,
    } = transferDto;

    if (source_branch_id === destination_branch_id) {
      throw new BadRequestException(
        'La sucursal de origen y destino no pueden ser la misma.',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const invRepo = queryRunner.manager.getRepository(BranchInventory);
      const transferRepo = queryRunner.manager.getRepository(Transfer);

      // 1. Validar y bloquear las filas de las entidades
      const sourceBranch = await queryRunner.manager.findOneBy(Branch, {
        id: source_branch_id,
      });
      const destBranch = await queryRunner.manager.findOneBy(Branch, {
        id: destination_branch_id,
      });
      const variante = await queryRunner.manager.findOneBy(ProductVariant, {
        id: variante_id,
      });

      if (!sourceBranch || !destBranch || !variante) {
        throw new NotFoundException(
          'Sucursal de origen, destino o la variante no existen.',
        );
      }

      // 2. Obtener la entrada de inventario de ORIGEN
      const sourceInventory = await invRepo.findOne({
        where: {
          sucursal: { id: source_branch_id },
          variante: { id: variante_id },
        },
        // --- Mejora Opcional (Nivel Profesional) ---
        // lock: { mode: 'pessimistic_write' }, 
      });

      // 3. Validar stock en origen
      if (!sourceInventory || sourceInventory.stock < quantity) {
        throw new BadRequestException(
          `Stock insuficiente en la sucursal de origen. Stock actual: ${
            sourceInventory?.stock || 0
          }`,
        );
      }

      // 4. Restar stock del ORIGEN
      sourceInventory.stock -= quantity;
      await invRepo.save(sourceInventory);

      // 5. Obtener la entrada de inventario de DESTINO (puede no existir)
      const destInventory = await invRepo.findOne({
        where: {
          sucursal: { id: destination_branch_id },
          variante: { id: variante_id },
        },
        // --- Mejora Opcional (Nivel Profesional) ---
        // lock: { mode: 'pessimistic_write' }, 
      });

      // 6. Sumar stock al DESTINO
      if (destInventory) {
        destInventory.stock += quantity;
        await invRepo.save(destInventory);
      } else {
        const newDestInventory = invRepo.create({
          sucursal: destBranch,
          variante: variante, 
          stock: quantity,
        });
        await invRepo.save(newDestInventory);
      }

      // 7. Guardar el log de la transferencia
      const transferLog = transferRepo.create({
        sourceBranch,
        destinationBranch: destBranch,
        variante,
        quantity,
      });
      const savedLog = await transferRepo.save(transferLog);

      // 8. Confirmar la transacción
      await queryRunner.commitTransaction();
      return savedLog; 
      
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ==================================================================
  // MÉTODOS EXISTENTES
  // ==================================================================

  /**
   * Asigna un stock inicial a una combinación de SKU (variante) y Sucursal.
   */
  async assignStock(assignDto: AssignStockDto): Promise<BranchInventory> {
    const { sucursal_id, variante_id, stock } = assignDto;

    const sucursal = await this.branchesService.findOne(sucursal_id);
    const variante = await this.productsService.findOneVariant(variante_id);

    const existingEntry = await this.inventoryRepository.findOne({
      where: {
        sucursal: { id: sucursal_id },
        variante: { id: variante_id },
      },
    });

    if (existingEntry) {
      throw new ConflictException(
        'Ya existe una entrada de inventario para este SKU en esta sucursal. Use el endpoint de actualización (PATCH).',
      );
    }

    const newInventoryEntry = this.inventoryRepository.create({
      sucursal,
      variante,
      stock,
    });

    return this.inventoryRepository.save(newInventoryEntry);
  }

  /**
   * Actualiza el stock de una entrada de inventario existente.
   */
  async updateStock(
    inventoryId: string,
    updateDto: UpdateStockDto,
  ): Promise<BranchInventory> {
    const inventoryEntry = await this.inventoryRepository.preload({
      id: inventoryId,
      ...updateDto,
    });

    if (!inventoryEntry) {
      throw new NotFoundException(
        `Entrada de inventario con ID "${inventoryId}" no encontrada.`,
      );
    }

    return this.inventoryRepository.save(inventoryEntry);
  }

  /**
   * Consulta el inventario completo de un SKU (variante) en todas las sucursales.
   */
  async findStockByVariant(varianteId: string): Promise<BranchInventory[]> {
    await this.productsService.findOneVariant(varianteId);

    return this.inventoryRepository.find({
      where: { variante: { id: varianteId } },
      relations: ['sucursal'], 
    });
  }

  /**
   * Consulta el inventario completo de una Sucursal.
   */
  async findStockByBranch(sucursalId: string): Promise<BranchInventory[]> {
    await this.branchesService.findOne(sucursalId);

    return this.inventoryRepository.find({
      where: { sucursal: { id: sucursalId } },
      // --- ESTE ES EL BUG CRÍTICO CORREGIDO ---
      relations: [
        'variante', 
        'variante.producto', 
        'variante.producto.categoria' // <-- Añadimos la relación anidada
      ], 
    });
  }

  /**
   * Elimina una entrada de inventario
   */
  async removeStockEntry(inventoryId: string): Promise<void> {
    const result = await this.inventoryRepository.delete(inventoryId);
    if (result.affected === 0) {
      throw new NotFoundException(
        `Entrada de inventario con ID "${inventoryId}" no encontrada.`,
      );
    }
  }
}