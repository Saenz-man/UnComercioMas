// src/inventory/inventory.controller.ts
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
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { AssignStockDto } from './DTO/assign-stock.dto';
import { UpdateStockDto } from './DTO/update-stock.dto';
import { TransferStockDto } from './DTO/transfer-stock.dto'; // <-- NUEVA IMPORTACIÓN

// --- Imports de Seguridad y Swagger ---
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Inventario / Stock por Sucursal')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) { }

  // ===========================================
  // ✅ NUEVO ENDPOINT DE TRANSFERENCIA
  // ===========================================
  @Post('transfer')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'ADMIN: Transfiere stock entre dos sucursales',
  })
  @ApiBody({ type: TransferStockDto })
  @ApiResponse({
    status: 201,
    description: 'Transferencia completada y registrada.',
  })
  @ApiResponse({
    status: 400,
    description: 'Stock insuficiente, o sucursales idénticas.',
  })
  @ApiResponse({
    status: 404,
    description: 'La sucursal de origen, destino o la variante no existen.',
  })
  transferStock(@Body() transferDto: TransferStockDto) {
    return this.inventoryService.transferStock(transferDto);
  }

  // --- ASIGNAR STOCK INICIAL (POST) ---
  @Post('assign')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'ADMIN: Asigna un SKU a una sucursal con stock inicial',
  })
  @ApiBody({ type: AssignStockDto })
  @ApiResponse({
    status: 201,
    description: 'Entrada de inventario creada con éxito.',
  })
  @ApiResponse({
    status: 409,
    description: 'El SKU ya existe en esa sucursal (Usar PATCH).',
  })
  assignStock(@Body() assignDto: AssignStockDto) {
    return this.inventoryService.assignStock(assignDto);
  }

  // --- ACTUALIZAR STOCK (PATCH) ---
  @Patch(':inventoryId')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'ADMIN: Actualiza el stock de una entrada de inventario específica',
  })
  @ApiBody({ type: UpdateStockDto })
  @ApiResponse({ status: 200, description: 'Stock actualizado.' })
  @ApiResponse({
    status: 404,
    description: 'Entrada de inventario no encontrada.',
  })
  updateStock(
    @Param('inventoryId') inventoryId: string,
    @Body() updateDto: UpdateStockDto,
  ) {
    return this.inventoryService.updateStock(inventoryId, updateDto);
  }

  // --- CONSULTAR STOCK POR SKU (GET) ---
  @Get('variant/:varianteId')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Consulta el stock de un SKU en todas las sucursales',
  })
  @ApiResponse({ status: 200, description: 'Inventario del SKU.' })
  @ApiResponse({ status: 404, description: 'Variante (SKU) no encontrada.' })
  findStockByVariant(@Param('varianteId') varianteId: string) {
    return this.inventoryService.findStockByVariant(varianteId);
  }

  // --- CONSULTAR STOCK POR SUCURSAL (GET) ---
  @Get('branch/:sucursalId')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Consulta todo el inventario de una sucursal' })
  @ApiResponse({ status: 200, description: 'Inventario de la sucursal.' })
  @ApiResponse({ status: 404, description: 'Sucursal no encontrada.' })
  findStockByBranch(@Param('sucursalId') sucursalId: string) {
    return this.inventoryService.findStockByBranch(sucursalId);
  }

  // --- ELIMINAR ENTRADA DE INVENTARIO (DELETE) ---
  @Delete(':inventoryId')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'ADMIN: Elimina una entrada de inventario (desasigna SKU de sucursal)',
  })
  @ApiResponse({ status: 204, description: 'Entrada eliminada.' })
  @ApiResponse({
    status: 404,
    description: 'Entrada de inventario no encontrada.',
  })
  removeStockEntry(@Param('inventoryId') inventoryId: string) {
    return this.inventoryService.removeStockEntry(inventoryId);
  }
}