// src/products/products.service.ts
import { 
  Injectable, 
  NotFoundException,
  BadRequestException, 
  InternalServerErrorException 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './DTO/create-product-dto';
import { UpdateProductDto } from './DTO/update-product-dto';
import { CategoriesService } from '../categories/service/categories.service'; 

// --- Importar entidad y DTOs de Variantes ---
import { ProductVariant } from './entities/product-variant.entity';
import { CreateProductVariantDto } from './DTO/create-product-variant.dto';
import { UpdateProductVariantDto } from './DTO/update-product-variant.dto';

// --- Imports para Carga Masiva (CSV) ---
// --- 1. CAMBIO DE IMPORTACIÓN ---
import csvParser = require('csv-parser');
import { Readable } from 'stream';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    
    @InjectRepository(ProductVariant)
    private readonly productVariantRepository: Repository<ProductVariant>,

    private readonly categoriesService: CategoriesService,
  ) {}

  // ====================================================
  // --- CRUD del Producto "Padre" ---
  // ====================================================

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const { categoria_id, ...productData } = createProductDto;
    const categoria = await this.categoriesService.findOne(categoria_id);

    const nuevoProducto = this.productRepository.create({
      ...productData,
      categoria: categoria, 
    });

    return this.productRepository.save(nuevoProducto);
  }

  // ... (tus otros métodos de producto padre: findAll, findOne, update, remove) ...
  async findAll(): Promise<Product[]> {
    return this.productRepository.find({
      relations: ['categoria'],
    });
  }

  async findOne(id: string): Promise<Product> {
    const producto = await this.productRepository.findOne({
      where: { id },
      relations: ['categoria'],
    });

    if (!producto) {
      throw new NotFoundException(`Producto con ID "${id}" no encontrado.`);
    }
    return producto;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const { categoria_id, ...productData } = updateProductDto;
    
    const producto = await this.productRepository.preload({
      id: id,
      ...productData,
    });

    if (!producto) {
      throw new NotFoundException(`Producto con ID "${id}" no encontrado.`);
    }

    if (categoria_id) {
      const categoria = await this.categoriesService.findOne(categoria_id);
      producto.categoria = categoria;
    }

    return this.productRepository.save(producto);
  }

  async remove(id: string): Promise<void> {
    const result = await this.productRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Producto con ID "${id}" no encontrado.`);
    }
  }

  // ====================================================
  // --- CRUD de Variantes (SKUs) ---
  // ====================================================

  // ... (tus otros métodos de variantes: createVariant, findVariantsByProduct, etc.) ...
  async createVariant(
    productId: string, 
    createDto: CreateProductVariantDto
  ): Promise<ProductVariant> {
    
    const productoPadre = await this.findOne(productId);
    
    const newVariant = this.productVariantRepository.create({
      ...createDto,
      producto: productoPadre,
    });

    return this.productVariantRepository.save(newVariant);
  }

  async findVariantsByProduct(productId: string): Promise<ProductVariant[]> {
    return this.productVariantRepository.find({
      where: { 
        producto: { id: productId } 
      }
    });
  }

  async updateVariant(
    variantId: string, 
    updateDto: UpdateProductVariantDto
  ): Promise<ProductVariant> {
    
    const variant = await this.productVariantRepository.preload({
      id: variantId,
      ...updateDto,
    });

    if (!variant) {
      throw new NotFoundException(`Variante con ID "${variantId}" no encontrada.`);
    }

    return this.productVariantRepository.save(variant);
  }

  async removeVariant(variantId: string): Promise<void> {
    const result = await this.productVariantRepository.delete(variantId);

    if (result.affected === 0) {
      throw new NotFoundException(`Variante con ID "${variantId}" no encontrada.`);
    }
  }

  async findOneVariant(variantId: string): Promise<ProductVariant> {
    const variant = await this.productVariantRepository.findOne({
      where: { id: variantId },
      relations: ['producto']
    });

    if (!variant) {
      throw new NotFoundException(`Variante con ID "${variantId}" no encontrada.`);
    }
    return variant;
  }

  // ----------------------------------------------------
  // --- LÓGICA DE CARGA MASIVA DE VARIANTES ---
  // ----------------------------------------------------
  async bulkCreateVariants(
    productId: string,
    fileBuffer: Buffer,
  ): Promise<{ count: number }> {
    
    // 1. Validamos que el producto padre exista
    const productoPadre = await this.findOne(productId);
    if (!productoPadre) {
      throw new NotFoundException(`Producto con ID "${productId}" no encontrado.`);
    }

    // 2. Parseamos el CSV
    const parsedRows: any[] = await new Promise((resolve, reject) => {
      // --- 2. CAMBIO DE TIPADO ---
      const results: any[] = []; 
      const stream = Readable.from(fileBuffer); 

      stream
        .pipe(csvParser({
          // ESTA ES LA LÍNEA MÁGICA
          mapHeaders: ({ header }) => header.replace('\ufeff', '')
        }))
        .on('data', (data) => {
          results.push(data); // <-- Esto ahora funciona gracias al tipado de 'results'
        })
        .on('end', () => {
          resolve(results); 
        })
        .on('error', (error) => {
          reject(new BadRequestException(`Error al parsear el CSV: ${error.message}`));
        });
    });

    if (parsedRows.length === 0) {
      throw new BadRequestException('El archivo CSV está vacío o en un formato incorrecto.');
    }

    // 3. Transformamos las filas del CSV en Entidades
    const nuevasVariantes: ProductVariant[] = parsedRows.map((row) => {
      const { sku, stock, ...atributos } = row;

      if (!sku || stock === undefined || stock === '') {
        throw new BadRequestException(`Fila malformada. 'sku' y 'stock' son requeridos: ${JSON.stringify(row)}`);
      }

      return this.productVariantRepository.create({
        producto: productoPadre,
        sku: sku,
        stock: parseInt(stock, 10), 
        atributos: atributos, 
      });
    });

    // 4. Guardamos TODAS las variantes en una sola transacción
    try {
      await this.productVariantRepository.save(nuevasVariantes, { chunk: 100 }); 
      return { count: nuevasVariantes.length };
    } catch (error) {
      if (error.code === '23505') { 
        throw new BadRequestException(`Error: Uno o más SKUs en el archivo ya existen en la base de datos. ${error.detail}`);
      }
      throw new InternalServerErrorException(`Error al guardar las variantes: ${error.message}`);
    }
  }
}