// src/products/products.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, DeepPartial, In } from 'typeorm'; // Importa 'In'
import { Product } from './entities/product.entity';
import { CreateProductDto } from './DTO/create-product-dto';
import { UpdateProductDto } from './DTO/update-product-dto';
import { CategoriesService } from '../categories/service/categories.service';

import { ProductVariant } from './entities/product-variant.entity';
import { CreateProductVariantDto } from './DTO/create-product-variant.dto';
import { UpdateProductVariantDto } from './DTO/update-product-variant.dto';

import { VolumePrice } from './entities/volume-price.entity';
import { BranchesService } from '../branches/branches.service';
import { InventoryService } from '../inventory/inventory.service';

import csvParser = require('csv-parser');
import { Readable } from 'stream';


// --- FUNCIÓN DE VERIFICACIÓN DE UUID (NUEVA) ---
const isUuid = (value: string): boolean => {
  // Patrón simple de UUID v4 (36 caracteres, incluyendo guiones)
  // Utilizamos una regex simple para evitar pasar cadenas cortas como 'p'
  // El i al final es para que sea insensible a mayúsculas/minúsculas (Aunque UUID v4 es case-insensitive)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return value.length === 36 && uuidRegex.test(value);
};
// ------------------------------------------------

@Injectable()
// --- ¡CORRECCIÓN AQUÍ! ---
export class ProductsService { // <-- Añadido 'export'
// --- FIN CORRECCIÓN ---
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly productVariantRepository: Repository<ProductVariant>,
    @InjectRepository(VolumePrice)
    private readonly volumePriceRepository: Repository<VolumePrice>,
    private readonly categoriesService: CategoriesService,
    private readonly branchesService: BranchesService,
    @Inject(forwardRef(() => InventoryService))
    private readonly inventoryService: InventoryService,
    private readonly dataSource: DataSource,
  ) {}

// ====================================================
// --- MÉTODOS DE LECTURA (CORREGIDO) ---
// ====================================================
async findAll(search?: string): Promise<Product[]> {
  const query = this.productRepository
    .createQueryBuilder('product')
    .leftJoinAndSelect('product.categoria', 'categoria')
    .leftJoinAndSelect('product.variantes', 'variantes')
    .leftJoinAndSelect('product.preciosPorVolumen', 'preciosPorVolumen');

  if (search && search.trim() !== '') {
    const searchTerms = search.toLowerCase().trim().split(/\s+/).filter(t => t.length > 0);
    
    // Inicializa una condición que siempre es falsa (1=0)
    query.where('1=0'); 

    searchTerms.forEach((term, index) => {
      const paramName = `searchParam_${index}`;
      const lowerSearch = `%${term}%`;
      
      // 1. Condición base (para LIKE)
      let condition = `
        (LOWER(product.nombre) LIKE :${paramName}
         OR LOWER(product.slug) LIKE :${paramName}
         OR LOWER(product.modelo) LIKE :${paramName}
         OR LOWER(categoria.nombre) LIKE :${paramName} 
         OR LOWER(variantes.sku) LIKE :${paramName}
      `;
      
      const parameters: Record<string, any> = { [paramName]: lowerSearch };

      // 2. CORRECCIÓN CLAVE: Solo añadimos la búsqueda por ID si el término es un UUID válido.
      // Esto evita el error 22P02 de PostgreSQL.
      if (isUuid(term)) {
          // Si es un UUID, lo buscamos exactamente. Usamos el término original (case-sensitive) para el ID.
          condition += ` OR product.id = :searchRaw`;
          parameters.searchRaw = search; 
      }
      
      condition += `)`; // Cierra el paréntesis de la condición OR
      
      // 3. Aplicamos la condición con OR a la consulta principal.
      query.orWhere(condition, parameters);
    });
  }

  return query.getMany();
}


  async findOne(id: string): Promise<Product> {
    const producto = await this.productRepository.findOne({
      where: { id },
      relations: ['categoria', 'variantes', 'preciosPorVolumen'],
    });

    if (!producto) {
      throw new NotFoundException(`Producto con ID "${id}" no encontrado.`);
    }
    return producto;
  }

  async findOneVariant(variantId: string): Promise<ProductVariant> {
    const variant = await this.productVariantRepository.findOne({
      where: { id: variantId },
      relations: ['producto'],
    });

    if (!variant) {
      throw new NotFoundException(
        `Variante con ID "${variantId}" no encontrada.`,
      );
    }
    return variant;
  }

  // ====================================================
  // --- CRUD del Producto "Padre" ---
  // ====================================================
  async create(createProductDto: CreateProductDto): Promise<Product> {

    console.log(`[ProductsService] DTO Recibido en create():`, JSON.stringify(createProductDto, null, 2));

    const {
      variantes: variantesDto = [],
      preciosPorVolumen: preciosDto = [],
      categoria_id,
      fotos,
      video,
      ...productData
    } = createProductDto;

    if (fotos && fotos.length > 0) {
      console.log(`[ProductsService] 'fotos' recibidas:`, fotos);
    } else {
      console.warn(`[ProductsService] ADVERTENCIA: El campo 'fotos' (padre) llegó vacío o nulo.`);
    }

    const categoria = await this.categoriesService.findOne(categoria_id);
    if (!categoria) {
      throw new BadRequestException(`La categoría con ID ${categoria_id} no existe.`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let product: Product;

    try {
      const newVariantes: DeepPartial<ProductVariant>[] = variantesDto.map(
        (variantDto, index) => {
          console.log(`[ProductsService] Procesando variante DTO [${index}]:`, JSON.stringify(variantDto, null, 2));
          const { opciones, stock, foto, ...rest } = variantDto;
          console.log(`[ProductsService] Contenido de 'rest' para variante [${index}] (sin foto/stock):`, JSON.stringify(rest, null, 2));

          return this.productVariantRepository.create({
            ...rest,
            stock: stock || 0,
            atributos: opciones,
            foto_variante: foto,
          });
        },
      );

      const newPrecios = preciosDto.map((precioDto) =>
        this.volumePriceRepository.create(precioDto),
      );

      product = this.productRepository.create({
        ...productData,
        fotos: fotos,
        video: video,
        categoria,
        variantes: newVariantes,
        preciosPorVolumen: newPrecios,
      });

      console.log(`[ProductsService] Entidad de Producto ANTES de guardar:`, JSON.stringify(product, null, 2));

      await queryRunner.manager.save(product);
      await queryRunner.commitTransaction();

      // --- Lógica de asignación de inventario ---
      try {
        const matriz = await this.branchesService.findMatriz();
        const asignaciones = product.variantes.map(variant => {
          const stock = variant.stock || 0;
          if (stock > 0) {
            return this.inventoryService.assignStock({
              sucursal_id: matriz.id,
              variante_id: variant.id,
              stock: stock,
            });
          }
          return Promise.resolve();
        });
        await Promise.allSettled(asignaciones);
        console.log(`[ProductsService] Inventario de ${asignaciones.length} variantes asignado a la Matriz.`);
      } catch (inventoryError) {
          console.error("[ProductsService] ADVERTENCIA: Falló la asignación inicial de inventario:", inventoryError);
      }

      return this.findOne(product.id);

    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      console.error('[ProductsService] Error detallado al crear producto:', error);
      if (error.code === '23505') { /* ... manejo duplicados ... */ }
      throw new InternalServerErrorException(`Error al crear el producto: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  // =================================================================
// --- MÉTODO UPDATE (con corrección en actualización de opciones) ---
// =================================================================
async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
  console.log(`[ProductsService] DTO Recibido en update() para ID ${id}:`, JSON.stringify(updateProductDto, null, 2));

  const {
    categoria_id,
    variantes: variantesDto,
    preciosPorVolumen: preciosDto,
    fotos,
    video,
    ...productData
  } = updateProductDto;

  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const producto = await queryRunner.manager.findOne(Product, {
      where: { id },
      relations: ['variantes', 'preciosPorVolumen', 'categoria'],
    });

    if (!producto) {
      throw new NotFoundException(`Producto con ID "${id}" no encontrado.`);
    }

    queryRunner.manager.merge(Product, producto, productData, { fotos, video });

    // --- Actualización de categoría ---
    if (categoria_id && producto.categoria?.id !== categoria_id) {
      const categoria = await this.categoriesService.findOne(categoria_id);
      if (!categoria) {
        throw new BadRequestException(`Categoría con ID ${categoria_id} no existe.`);
      }
      producto.categoria = categoria;
    }

    // --- Lógica de Variantes ---
    if (variantesDto !== undefined) {
      console.log('[ProductsService] Actualizando variantes...');
      const existingVariantsMap = new Map(producto.variantes.map(v => [v.sku, v]));
      const processedVariantIds = new Set<string>();
      const updatedOrNewVariants: ProductVariant[] = [];

      for (const variantDto of variantesDto) {
        const { opciones, foto, stock, ...rest } = variantDto;
        const existingVariant = existingVariantsMap.get(variantDto.sku);

        if (existingVariant) {
          console.log(`[ProductsService] Variante encontrada, actualizando SKU: ${existingVariant.sku}`);

          // Actualización explícita del JSON `atributos`
          existingVariant.atributos = opciones ?? existingVariant.atributos;
          existingVariant.foto_variante = foto ?? existingVariant.foto_variante;
          existingVariant.stock = stock ?? existingVariant.stock;

          // Merge de demás campos simples
          Object.assign(existingVariant, rest);

          // Guardar siempre con save(), no merge (para que se detecten cambios en JSON)
          const updatedVariant = await queryRunner.manager.save(ProductVariant, existingVariant);
          updatedOrNewVariants.push(updatedVariant);
          processedVariantIds.add(existingVariant.id);
        } else {
          console.log(`[ProductsService] Variante nueva, creando SKU: ${variantDto.sku}`);
          const newVariantEntity = queryRunner.manager.create(ProductVariant, {
            ...rest,
            stock: stock || 0,
            atributos: opciones,
            foto_variante: foto,
            producto: { id: producto.id },
          });
          const savedNewVariant = await queryRunner.manager.save(ProductVariant, newVariantEntity);
          updatedOrNewVariants.push(savedNewVariant);
          processedVariantIds.add(savedNewVariant.id);

          // Asignación de inventario si aplica
          if (stock && stock > 0) {
            try {
              const matriz = await this.branchesService.findMatriz();
              await this.inventoryService.assignStock({
                sucursal_id: matriz.id,
                variante_id: savedNewVariant.id,
                stock: stock,
              });
            } catch (err) {
              console.warn(`[ProductsService] Falló asignación de inventario para ${variantDto.sku}:`, err.message);
            }
          }
        }
      }

      // --- Eliminación de variantes que ya no están ---
      const variantsToDelete = producto.variantes.filter(v => !processedVariantIds.has(v.id));
      if (variantsToDelete.length > 0) {
        console.log(`[ProductsService] Eliminando ${variantsToDelete.length} variantes antiguas.`);
        await queryRunner.manager.remove(variantsToDelete);
      }

      producto.variantes = updatedOrNewVariants;
    }

    // --- Actualización de precios por volumen ---
    if (preciosDto) {
      await queryRunner.manager.delete(VolumePrice, { producto: { id } });
      const newPrecios = preciosDto.map((precioDto) =>
        queryRunner.manager.create(VolumePrice, { ...precioDto, producto: { id: producto.id } }),
      );
      await queryRunner.manager.save(VolumePrice, newPrecios);
      producto.preciosPorVolumen = newPrecios;
    }

    await queryRunner.manager.save(Product, producto);
    await queryRunner.commitTransaction();

    console.log(`[ProductsService] Producto ${id} actualizado exitosamente.`);
    return this.findOne(producto.id);
  } catch (error: any) {
    await queryRunner.rollbackTransaction();
    console.error('[ProductsService] Error detallado al ACTUALIZAR producto:', error);
    if (error instanceof NotFoundException || error instanceof BadRequestException) {
      throw error;
    }
    throw new InternalServerErrorException(`Error al actualizar el producto: ${error.message}`);
  } finally {
    await queryRunner.release();
  }
}


  // ====================================================
  // --- MÉTODO REMOVE (Individual) ---
  // ====================================================

  async remove(id: string): Promise<void> {
    console.log(`[ProductsService] Solicitud para eliminar producto ${id}`);
    const result = await this.productRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Producto con ID "${id}" no encontrado.`);
    }
    console.log(`[ProductsService] Producto ${id} eliminado.`);
  }

  // --- Borrado Masivo (Corregido) ---
  async bulkRemove(productIds: string[]): Promise<void> {
    if (!productIds || productIds.length === 0) {
      console.warn('[ProductsService] bulkRemove llamado con array de IDs vacío.');
      return;
    }
    console.log(`[ProductsService] Iniciando borrado masivo para ${productIds.length} producto(s):`, productIds);
    // IMPORTANTE: Considera la cascada/limpieza de inventario aquí si es necesario

    try {
      const deleteResult = await this.productRepository.delete({
        id: In(productIds),
      });
      console.log(`[ProductsService] Resultado del borrado masivo:`, deleteResult);

      const affectedCount = deleteResult?.affected ?? 0; // Acceso seguro

      if (affectedCount === 0) {
        console.warn(`[ProductsService] No se encontraron productos para los IDs proporcionados en borrado masivo.`);
      } else if (affectedCount < productIds.length) {
         console.warn(`[ProductsService] Se eliminaron ${affectedCount} productos, pero se solicitaron ${productIds.length}. Algunos IDs no existían.`);
      } else {
         console.log(`[ProductsService] ${affectedCount} producto(s) eliminados exitosamente.`);
      }

    } catch (error: any) {
        console.error('[ProductsService] Error durante el borrado masivo:', error);
        throw new InternalServerErrorException(`Error al eliminar productos masivamente: ${error.message}`);
    }
  }

  // ====================================================
  // --- CRUD de Variantes Individuales ---
  // ====================================================
  async createVariant(
    productId: string,
    createDto: CreateProductVariantDto,
  ): Promise<ProductVariant> {
    const productoPadre = await this.findOne(productId);
    const { opciones, stock, foto, ...rest } = createDto;

    const newVariant = this.productVariantRepository.create({
      ...rest,
      stock: stock || 0,
      atributos: opciones,
      foto_variante: foto,
      producto: productoPadre,
    });

    const savedVariant = await this.productVariantRepository.save(newVariant);

    if (stock > 0) { /* ... asignación inventario ... */ }
    return savedVariant;
  }

  async findVariantsByProduct(productId: string): Promise<ProductVariant[]> {
    return this.productVariantRepository.find({
      where: { producto: { id: productId } },
    });
  }

  async updateVariant(
    variantId: string,
    updateDto: UpdateProductVariantDto,
  ): Promise<ProductVariant> {
    const { opciones, foto, ...rest } = updateDto;
    const preloadData: DeepPartial<ProductVariant> = { ...rest };
    if (opciones !== undefined) { preloadData.atributos = opciones; }
    if (foto !== undefined) { preloadData.foto_variante = foto; }

    const variant = await this.productVariantRepository.preload({
      id: variantId,
      ...preloadData,
    });
    if (!variant) { throw new NotFoundException(`Variante con ID "${variantId}" no encontrada.`); }

    // Falta lógica para actualizar inventario si cambia el stock
    return this.productVariantRepository.save(variant);
  }

  async removeVariant(variantId: string): Promise<void> {
     // Falta lógica para eliminar inventario asociado
    const result = await this.productVariantRepository.delete(variantId);
    if (result.affected === 0) { throw new NotFoundException(`Variante con ID "${variantId}" no encontrada.`); }
  }

 // ----------------------------------------------------
  // --- LÓGICA DE CARGA MASIVA DE VARIANTES (Corregido) ---
  // ----------------------------------------------------
  async bulkCreateVariants(
    productId: string,
    fileBuffer: Buffer,
  ): Promise<{ count: number }> {
    const productoPadre = await this.findOne(productId);

    let parsedRows: any[] = [];

    await new Promise((resolve, reject) => {
      const stream = Readable.from(fileBuffer);
      stream
        .pipe(csvParser({ mapHeaders: ({ header }) => header.replace('\ufeff', '') }))
        .on('data', (data) => parsedRows.push(data))
        .on('end', () => resolve(null))
        .on('error', (error) => reject(new BadRequestException(`Error al parsear el CSV: ${error.message}`)));
    });

    if (parsedRows.length === 0) {
      throw new BadRequestException('El archivo CSV está vacío o en un formato incorrecto.');
    }

    try {
      // 1. Creamos el array de entidades parciales (DeepPartial<ProductVariant>[])
      const variantsToSave = parsedRows.map((row) => {
          const { sku, stock, ...atributos } = row;

          if (!sku || stock === undefined || stock === '') {
            throw new BadRequestException(`Fila malformada. 'sku' y 'stock' son requeridos: ${JSON.stringify(row)}`);
          }
          const stockNum = parseInt(stock, 10);
          if (isNaN(stockNum)) {
             throw new BadRequestException(`Stock inválido para SKU ${sku}: "${stock}". Debe ser un número.`);
          }

          // create() devuelve DeepPartial<ProductVariant>
          return this.productVariantRepository.create({
            producto: { id: productoPadre.id }, // Asocia por ID
            sku: sku,
            stock: stockNum,
            atributos: atributos,
            // foto_variante no viene del CSV aquí
          });
      });

      // 2. Guardamos el array de entidades parciales.
      //    'save' acepta DeepPartial<Entity>[] y devuelve Promise<Entity[]>
      // --- ¡CORRECCIÓN AQUÍ: Quitamos : ProductVariant[] ! ---
      const savedVariants = await this.productVariantRepository.save(
          variantsToSave, // Pasamos DeepPartial<ProductVariant>[]
          { chunk: 100 }
      );
      // --- FIN CORRECCIÓN ---
      // Ahora TypeScript infiere correctamente que savedVariants es ProductVariant[]

      // --- Lógica de asignación de inventario (Usa savedVariants que ahora es ProductVariant[]) ---
      try {
        const matriz = await this.branchesService.findMatriz();
        const asignaciones = savedVariants.map((variant) => { // variant aquí es ProductVariant
          if (variant.stock > 0) {
            return this.inventoryService.assignStock({
              sucursal_id: matriz.id,
              variante_id: variant.id, // ID existe porque la entidad está completa
              stock: variant.stock,
            });
          }
          return Promise.resolve();
        });
        await Promise.allSettled(asignaciones);
         console.log(`[ProductsService] Inventario masivo asignado a Matriz para ${asignaciones.length} variantes.`);
      } catch (inventoryError) {
        console.error("Advertencia: Falló la asignación de inventario masivo a la Matriz:", inventoryError);
      }
      // -----------------------------------------------------

      // Retornamos la cuenta
      return { count: savedVariants.length };

    } catch (error: any) {
      if (error.code === '23505') { /* ... manejo duplicados ... */ }
      if (error instanceof BadRequestException) { throw error; }
      throw new InternalServerErrorException(`Error al guardar las variantes: ${error.message}`);
    }
  } // Fin de bulkCreateVariants
} // Fin de la clase