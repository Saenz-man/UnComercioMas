// src/inventory/inventory.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException, // <-- Importado
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm'; // <-- Importado DataSource
import { BranchInventory } from './entities/inventario-sucursal.entity';
import { AssignStockDto } from './DTO/assign-stock.dto';
import { UpdateStockDto } from './DTO/update-stock.dto';

// Importamos los servicios/repositorios que necesitamos para validar
import { BranchesService } from '../branches/branches.service';
import { ProductsService } from '../products/products.service';

// --- NUEVAS IMPORTACIONES ---
import { TransferStockDto } from './DTO/transfer-stock.dto'; // DTO de transferencia
import { Transfer } from './entities/transferencia-inventario.entity.'; // Entidad de log
import { ProductVariant } from '../products/entities/product-variant.entity'; // Entidad de variante
import { Branch } from '../branches/entities/branch.entity'; // Entidad de sucursal

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(BranchInventory)
    private readonly inventoryRepository: Repository<BranchInventory>,

    // --- NUEVAS INYECCIONES ---
    @InjectRepository(Transfer) // Repo para logs de transferencia
    private readonly transferRepository: Repository<Transfer>,
    @InjectRepository(ProductVariant) // Repo para validar variantes
    private readonly variantRepository: Repository<ProductVariant>,
    @InjectRepository(Branch) // Repo para validar sucursales
    private readonly branchRepository: Repository<Branch>,

    // Inyectamos el DataSource para manejar la transacción
    private readonly dataSource: DataSource,
    // --- FIN NUEVAS INYECCIONES ---

    // Inyectamos los servicios de sucursales y productos
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

    // Validación básica
    if (source_branch_id === destination_branch_id) {
      throw new BadRequestException(
        'La sucursal de origen y destino no pueden ser la misma.',
      );
    }

    // Usamos el 'queryRunner' para controlar la transacción manualmente
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    // Iniciamos la transacción
    await queryRunner.startTransaction();

    try {
      // Obtenemos repositorios que operarán DENTRO de la transacción
      const invRepo = queryRunner.manager.getRepository(BranchInventory);
      const transferRepo = queryRunner.manager.getRepository(Transfer);

      // 1. Validar y bloquear las filas de las entidades
      // (usamos 'findOneBy' para validar que existan)
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
      // Usamos 'findOne' para cargar la relación
      const sourceInventory = await invRepo.findOne({
        where: {
          sucursal: { id: source_branch_id },
          variante: { id: variante_id },
        },
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
      });

      // 6. Sumar stock al DESTINO
      if (destInventory) {
        // Si ya existe la entrada, solo sumamos el stock
        destInventory.stock += quantity;
        await invRepo.save(destInventory);
      } else {
        // Si no existe, creamos una nueva entrada de inventario
        const newDestInventory = invRepo.create({
          sucursal: destBranch, // Usamos la entidad que ya validamos
          variante: variante, // Usamos la entidad que ya validamos
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

      // 8. Si todo salió bien, confirmar la transacción
      await queryRunner.commitTransaction();
      return savedLog; // Devolvemos el log
      
    } catch (error) {
      // 9. Si algo falló, revertir TODOS los cambios
      await queryRunner.rollbackTransaction();
      // Re-lanzamos el error para que Nest lo maneje (ej. BadRequest, NotFound)
      throw error;
    } finally {
      // 10. Siempre liberar el queryRunner
      await queryRunner.release();
    }
  }

  // ==================================================================
  // MÉTODOS EXISTENTES
  // ==================================================================

  /**
   * Asigna un stock inicial a una combinación de SKU (variante) y Sucursal.
   * Crea una nueva entrada en la tabla 'inventario_sucursal'.
   */
  async assignStock(assignDto: AssignStockDto): Promise<BranchInventory> {
    const { sucursal_id, variante_id, stock } = assignDto;

    // 1. Validar que la sucursal exista
    // Usamos 'findOne' que ya lanza un 404 si no existe
    const sucursal = await this.branchesService.findOne(sucursal_id);

    // 2. Validar que la variante (SKU) exista
    // Usamos 'findOneVariant' que ya lanza un 404 si no existe
    const variante = await this.productsService.findOneVariant(variante_id);

    // 3. (Opcional) Verificar si ya existe esta combinación
    // Esto lo previene la BD con @Unique, pero es bueno validarlo aquí
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

    // 4. Crear y guardar la nueva entrada de inventario
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
    // 'preload' carga la entrada y la fusiona con los nuevos datos (el stock)
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
    // Validamos que el SKU exista
    await this.productsService.findOneVariant(varianteId);

    return this.inventoryRepository.find({
      where: { variante: { id: varianteId } },
      relations: ['sucursal'], // Carga los datos de la sucursal (ej. nombre)
    });
  }

  /**
   * Consulta el inventario completo de una Sucursal.
   */
  async findStockByBranch(sucursalId: string): Promise<BranchInventory[]> {
    // Validamos que la sucursal exista
    await this.branchesService.findOne(sucursalId);

    return this.inventoryRepository.find({
      where: { sucursal: { id: sucursalId } },
      relations: ['variante', 'variante.producto'], // Carga el SKU y el producto padre
    });
  }

  /**
   * Elimina una entrada de inventario (ej. si el producto se descontinúa en esa sucursal)
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