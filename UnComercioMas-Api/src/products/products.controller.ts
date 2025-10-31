// src/products/products.controller.ts
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
  ParseUUIDPipe, // <-- *** CORRECCIÓN AQUÍ: Importación añadida ***
  Query,
} from '@nestjs/common';
import { ProductsService } from './products.service';

// --- DTOs del Producto "Padre" ---
import { CreateProductDto } from './DTO/create-product-dto';
import { UpdateProductDto } from './DTO/update-product-dto';

// --- DTOs de Variantes ---
import { CreateProductVariantDto } from './DTO/create-product-variant.dto';
import { UpdateProductVariantDto } from './DTO/update-product-variant.dto';

// --- Imports de Seguridad y Swagger ---
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/Guards/roles.guard';
import { Roles } from '../auth/Decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

// --- Imports para Manejo de Archivos ---
import { FileInterceptor } from '@nestjs/platform-express';

// --- DTO para Borrado Masivo ---
import { IsUUID, IsArray, ArrayNotEmpty } from 'class-validator';
class BulkDeleteProductsDto {
  @IsArray({ message: 'productIds debe ser un array.' })
  @ArrayNotEmpty({ message: 'productIds no puede estar vacío.' })
  @IsUUID('4', { each: true, message: 'Cada ID en productIds debe ser un UUID v4 válido.' })
  productIds: string[];
}
// --- FIN DTO ---

@ApiTags('Catálogo / Productos y Variantes')
@Controller('products') // Prefijo global 'api/v1' se aplica automáticamente
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ====================================================
  // --- CRUD del Producto "Padre" ---
  // ====================================================

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

  @Get()
findAll(@Query('search') search?: string) {
  return this.productsService.findAll(search);
}


  // Ahora ParseUUIDPipe se reconoce
  @Get(':id')
  @ApiOperation({ summary: 'PÚBLICO: Obtiene un producto "Padre" por ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ADMIN: Actualiza un producto "Padre" por ID' })
  @ApiBody({ type: UpdateProductDto })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'ADMIN: Elimina un producto "Padre" (y sus variantes)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.remove(id);
  }

  // --- Endpoint Borrado Masivo ---
  @Delete('bulk')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'ADMIN: Eliminar múltiples productos por sus IDs' })
  @ApiBody({ type: BulkDeleteProductsDto, description: 'Array con los IDs (UUIDs) de los productos a eliminar' })
  @ApiResponse({ status: 204, description: 'Productos eliminados exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos (ej. array vacío, IDs no son UUIDs válidos).' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 403, description: 'Prohibido (rol no permitido).' })
  async bulkRemove(@Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) bulkDeleteDto: BulkDeleteProductsDto): Promise<void> {
    console.log(`[ProductsController] Solicitud de borrado masivo recibida para IDs:`, bulkDeleteDto.productIds);
    await this.productsService.bulkRemove(bulkDeleteDto.productIds);
  }
  // --- FIN Borrado Masivo ---


  // ====================================================
  // --- CRUD de Variantes (SKUs) ---
  // ====================================================

  @Post(':productId/variants')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'ADMIN: Crea una nueva variante (SKU) para un producto' })
  @ApiResponse({ status: 201, description: 'Variante creada.'})
  @ApiResponse({ status: 404, description: 'Producto padre no encontrado.'})
  @ApiBody({ type: CreateProductVariantDto })
  createVariant(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() createVariantDto: CreateProductVariantDto,
  ) {
    return this.productsService.createVariant(productId, createVariantDto);
  }

  // --- Endpoint Carga Masiva ---
  @Post(':productId/variants/bulk-upload')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ADMIN: Carga masiva de variantes (SKUs) desde un CSV' })
  @ApiResponse({ status: 201, description: 'Variantes creadas.'})
  @ApiResponse({ status: 400, description: 'Archivo CSV malformado o no proporcionado.'})
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } },
    description: 'Archivo CSV con columnas: sku, stock, [atributos...]',
  })
  @UseInterceptors(FileInterceptor('file'))
  async bulkCreateVariants(
    @Param('productId', ParseUUIDPipe) productId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) { throw new BadRequestException('No se ha subido ningún archivo.'); }
    return this.productsService.bulkCreateVariants(productId, file.buffer);
  }
  // --- FIN Carga Masiva ---

  @Get(':productId/variants')
  @ApiOperation({ summary: 'PÚBLICO: Obtiene todas las variantes (SKUs) de un producto' })
  @ApiResponse({ status: 200, description: 'Lista de variantes.'})
  findVariantsByProduct(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.productsService.findVariantsByProduct(productId);
  }

  @Patch('variants/:variantId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ADMIN: Actualiza una variante por su ID' })
  @ApiResponse({ status: 200, description: 'Variante actualizada.'})
  @ApiResponse({ status: 404, description: 'Variante no encontrada.'})
  @ApiBody({ type: UpdateProductVariantDto })
  updateVariant(
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Body() updateVariantDto: UpdateProductVariantDto,
  ) {
    return this.productsService.updateVariant(variantId, updateVariantDto);
  }

  @Delete('variants/:variantId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'ADMIN: Elimina una variante (SKU) por su ID' })
  @ApiResponse({ status: 204, description: 'Variante eliminada.'})
  @ApiResponse({ status: 404, description: 'Variante no encontrada.'})
  removeVariant(@Param('variantId', ParseUUIDPipe) variantId: string) {
    return this.productsService.removeVariant(variantId);
  }

  @Get('variants/:variantId')
  @ApiOperation({ summary: 'PÚBLICO: Obtiene una variante (SKU) específica por su ID' })
  @ApiResponse({ status: 200, description: 'Variante encontrada.'})
  @ApiResponse({ status: 404, description: 'Variante no encontrada.'})
  findOneVariant(@Param('variantId', ParseUUIDPipe) variantId: string) {
    return this.productsService.findOneVariant(variantId);
  }

} // Fin de la clase ProductsController