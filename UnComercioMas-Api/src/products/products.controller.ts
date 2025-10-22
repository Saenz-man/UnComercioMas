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
  BadRequestException 
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
// --- NO IMPORTAR 'Express' DE 'express' ---
// El tipo 'Express.Multer.File' es global.

  
@ApiTags('Catálogo / Productos y Variantes')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ====================================================
  // --- CRUD del Producto "Padre" (S2.3 / S2.5) ---
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
  @ApiOperation({ summary: 'PÚBLICO: Obtiene todos los productos "Padre"' })
  findAll() {
    return this.productsService.findAll();
  }

  // ... (tus otros endpoints de producto padre: findOne, update, remove) ...
  @Get(':id')
  @ApiOperation({ summary: 'PÚBLICO: Obtiene un producto "Padre" por ID' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard) 
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ADMIN: Actualiza un producto "Padre" por ID' })
  @ApiBody({ type: UpdateProductDto })
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard) 
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'ADMIN: Elimina un producto "Padre" (y todas sus variantes)' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  // ====================================================
  // --- CRUD de Variantes (SKUs) (S2.6) ---
  // ====================================================

  @Post(':productId/variants')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'ADMIN: Crea una nueva variante (SKU) para un producto' })
  @ApiResponse({ status: 201, description: 'Variante creada con éxito.'})
  @ApiResponse({ status: 404, description: 'Producto "Padre" no encontrado.'})
  @ApiBody({ type: CreateProductVariantDto })
  createVariant(
    @Param('productId') productId: string,
    @Body() createVariantDto: CreateProductVariantDto,
  ) {
    return this.productsService.createVariant(productId, createVariantDto);
  }

  // --- NUEVO ENDPOINT DE CARGA MASIVA ---
  @Post(':productId/variants/bulk-upload')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ADMIN: Carga masiva de variantes (SKUs) desde un CSV' })
  @ApiResponse({ status: 201, description: 'Variantes creadas con éxito.'})
  @ApiResponse({ status: 400, description: 'Archivo CSV malformado.'})
  @ApiConsumes('multipart/form-data') 
  @ApiBody({
    description: 'Archivo CSV con las variantes. Columnas requeridas: sku, stock. Columnas opcionales: talla, color, material, etc.',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file')) 
  async bulkCreateVariants(
    @Param('productId') productId: string,
    @UploadedFile() file: Express.Multer.File, // <-- Este tipo (Express.Multer.File) ahora funcionará
  ) {
    if (!file) {
      throw new BadRequestException('No se ha subido ningún archivo.');
    }
    
    return this.productsService.bulkCreateVariants(productId, file.buffer);
  }
  // --- FIN DE NUEVO ENDPOINT ---

  @Get(':productId/variants')
  @ApiOperation({ summary: 'PÚBLICO: Obtiene todas las variantes (SKUs) de un producto' })
  @ApiResponse({ status: 200, description: 'Lista de variantes del producto.'})
  findVariantsByProduct(@Param('productId') productId: string) {
    return this.productsService.findVariantsByProduct(productId);
  }

  // ... (tus otros endpoints de variantes: updateVariant, removeVariant, findOneVariant) ...
  @Patch('variants/:variantId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ADMIN: Actualiza una variante (ej. stock) por su ID' })
  @ApiResponse({ status: 200, description: 'Variante actualizada.'})
  @ApiResponse({ status: 404, description: 'Variante no encontrada.'})
  @ApiBody({ type: UpdateProductVariantDto })
  updateVariant(
    @Param('variantId') variantId: string,
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
  removeVariant(@Param('variantId') variantId: string) {
    return this.productsService.removeVariant(variantId);
  }

  @Get('variants/:variantId')
  @ApiOperation({ summary: 'PÚBLICO: Obtiene una variante (SKU) específica por su ID' })
  @ApiResponse({ status: 200, description: 'Variante encontrada.'})
  @ApiResponse({ status: 404, description: 'Variante no encontrada.'})
  findOneVariant(@Param('variantId') variantId: string) {
    return this.productsService.findOneVariant(variantId);
  }
}