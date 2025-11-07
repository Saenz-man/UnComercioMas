// ====================================================
// --- CONTROLADOR DE PRODUCTOS Y VARIANTES --- by Dev Saenz
// ====================================================
// Este controlador maneja todo el flujo del catálogo de productos:
// - CRUD completo de productos “Padre”
// - CRUD individual y masivo de Variantes (SKUs)
// - Borrado masivo de productos
// - Integración con seguridad (JWT + Roles)
// - Soporte para carga CSV y operaciones administrativas
// ====================================================

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ValidationPipe,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ProductsService } from './products.service';

// --- DTOs del Producto "Padre" ---
import { CreateProductDto } from './DTO/create-product-dto';
import { UpdateProductDto } from './DTO/update-product-dto';

// --- DTOs de Variantes ---
import { CreateProductVariantDto } from './DTO/create-product-variant.dto';
import { UpdateProductVariantDto } from './DTO/update-product-variant.dto';

// --- Seguridad y Swagger ---
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/Guards/roles.guard';
import { Roles } from '../auth/Decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

// --- Interceptor para manejo de archivos ---
import { FileInterceptor } from '@nestjs/platform-express';

// --- DTO para borrado masivo ---
import { IsUUID, IsArray, ArrayNotEmpty } from 'class-validator';
class BulkDeleteProductsDto {
  @IsArray({ message: 'productIds debe ser un array.' })
  @ArrayNotEmpty({ message: 'productIds no puede estar vacío.' })
  @IsUUID('4', {
    each: true,
    message: 'Cada ID en productIds debe ser un UUID v4 válido.',
  })
  productIds: string[];
}
// --- FIN DTO ---

@ApiTags('Catálogo / Productos y Variantes')
@Controller('products') // Prefijo global 'api/v1' se aplica automáticamente
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ====================================================
  // --- CRUD del Producto "Padre" --- by Dev Saenz
  // ====================================================

  // POST /api/v1/products
  // ----------------------------------------------------
  // Crea un nuevo producto “Padre” con sus relaciones iniciales:
  // - Fotos, video, categoría y opciones iniciales
  // - Puede incluir precios por volumen y variantes
  // ----------------------------------------------------
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'ADMIN: Crea un nuevo producto "Padre"' })
  @ApiBody({ type: CreateProductDto })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  // GET /api/v1/products
  // ----------------------------------------------------
  // Obtiene todos los productos disponibles o realiza una búsqueda
  // por nombre, slug o modelo usando el parámetro “search”.
  // ----------------------------------------------------
  @Get()
  findAll(@Query('search') search?: string) {
    return this.productsService.findAll(search);
  }

  // GET /api/v1/products/:id
  // ----------------------------------------------------
  // Retorna un producto “Padre” por su ID, incluyendo:
  // - Variantes (SKUs)
  // - Precios por volumen
  // - Categoría y opciones
  // ----------------------------------------------------
  @Get(':id')
  @ApiOperation({ summary: 'PÚBLICO: Obtiene un producto "Padre" por ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findOne(id);
  }

  // PATCH /api/v1/products/:id
  // ----------------------------------------------------
  // Actualiza un producto “Padre” y todas sus relaciones asociadas:
  // - Variantes (crea, actualiza o elimina dinámicamente)
  // - Precios por volumen (sincronización completa)
  // - Fotos, video, opciones y categoría
  // ----------------------------------------------------
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ADMIN: Actualiza un producto "Padre" por ID' })
  @ApiBody({ type: UpdateProductDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  // DELETE /api/v1/products/:id
  // ----------------------------------------------------
  // Elimina un producto “Padre” junto con sus variantes,
  // precios por volumen y cualquier referencia asociada.
  // ----------------------------------------------------
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'ADMIN: Elimina un producto "Padre" (y sus variantes)',
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.remove(id);
  }

  // DELETE /api/v1/products/bulk
  // ----------------------------------------------------
  // Permite eliminar múltiples productos simultáneamente.
  // Recibe un array de UUIDs de productos a eliminar.
  // ----------------------------------------------------
  @Delete('bulk')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'ADMIN: Eliminar múltiples productos por sus IDs' })
  @ApiBody({
    type: BulkDeleteProductsDto,
    description: 'Array con los IDs (UUIDs) de los productos a eliminar',
  })
  async bulkRemove(
    @Body(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    )
    bulkDeleteDto: BulkDeleteProductsDto,
  ): Promise<void> {
    console.log(
      `[ProductsController] Solicitud de borrado masivo recibida para IDs:`,
      bulkDeleteDto.productIds,
    );
    await this.productsService.bulkRemove(bulkDeleteDto.productIds);
  }

  // ====================================================
  // --- CRUD de Variantes (SKUs) --- by Dev Saenz
  // ====================================================

  // POST /api/v1/products/:productId/variants
  // ----------------------------------------------------
  // Crea una nueva variante (SKU) para un producto existente.
  // Las variantes heredan los atributos del producto “Padre”.
  // ----------------------------------------------------
  @Post(':productId/variants')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'ADMIN: Crea una nueva variante (SKU) para un producto' })
  @ApiResponse({ status: 201, description: 'Variante creada.' })
  @ApiResponse({ status: 404, description: 'Producto padre no encontrado.' })
  @ApiBody({ type: CreateProductVariantDto })
  createVariant(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() createVariantDto: CreateProductVariantDto,
  ) {
    return this.productsService.createVariant(productId, createVariantDto);
  }

  // POST /api/v1/products/:productId/variants/bulk-upload
  // ----------------------------------------------------
  // Carga masiva de variantes (SKUs) a través de un archivo CSV.
  // Ideal para importar catálogos de productos con múltiples tallas o colores.
  // ----------------------------------------------------
  @Post(':productId/variants/bulk-upload')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ADMIN: Carga masiva de variantes (SKUs) desde un CSV' })
  @ApiResponse({ status: 201, description: 'Variantes creadas.' })
  @ApiResponse({ status: 400, description: 'Archivo CSV malformado o no proporcionado.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
    description: 'Archivo CSV con columnas: sku, stock, [atributos...]',
  })
  @UseInterceptors(FileInterceptor('file'))
  async bulkCreateVariants(
    @Param('productId', ParseUUIDPipe) productId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No se ha subido ningún archivo.');
    }
    return this.productsService.bulkCreateVariants(productId, file.buffer);
  }

  // GET /api/v1/products/:productId/variants
  // ----------------------------------------------------
  // Devuelve todas las variantes (SKUs) asociadas a un producto “Padre”.
  // ----------------------------------------------------
  @Get(':productId/variants')
  @ApiOperation({
    summary: 'PÚBLICO: Obtiene todas las variantes (SKUs) de un producto',
  })
  findVariantsByProduct(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.productsService.findVariantsByProduct(productId);
  }

  // PATCH /api/v1/products/variants/:variantId
  // ----------------------------------------------------
  // Actualiza una variante individual por su ID.
  // Puede modificar stock, precio o atributos específicos.
  // ----------------------------------------------------
  @Patch('variants/:variantId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ADMIN: Actualiza una variante por su ID' })
  @ApiBody({ type: UpdateProductVariantDto })
  updateVariant(
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Body() updateVariantDto: UpdateProductVariantDto,
  ) {
    return this.productsService.updateVariant(variantId, updateVariantDto);
  }

  // DELETE /api/v1/products/variants/:variantId
  // ----------------------------------------------------
  // Elimina una variante (SKU) específica sin afectar al producto padre.
  // ----------------------------------------------------
  @Delete('variants/:variantId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'ADMIN: Elimina una variante (SKU) por su ID',
  })
  removeVariant(@Param('variantId', ParseUUIDPipe) variantId: string) {
    return this.productsService.removeVariant(variantId);
  }

  // GET /api/v1/products/variants/:variantId
  // ----------------------------------------------------
  // Obtiene los detalles de una variante específica por su ID.
  // ----------------------------------------------------
  @Get('variants/:variantId')
  @ApiOperation({
    summary: 'PÚBLICO: Obtiene una variante (SKU) específica por su ID',
  })
  findOneVariant(@Param('variantId', ParseUUIDPipe) variantId: string) {
    return this.productsService.findOneVariant(variantId);
  }
}
