// src/branches/branches.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards // <-- Importar
} from '@nestjs/common';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './DTO/create-branch.dto';
import { UpdateBranchDto } from './DTO/update-branch.dto';

// --- Imports de Seguridad y Swagger ---
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Inventario / Sucursales')
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) { }

  // --- CREAR (POST) [Protegido] ---
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'ADMIN: Crea una nueva sucursal' })
  @ApiBody({ type: CreateBranchDto })
  @ApiResponse({ status: 201, description: 'Sucursal creada con éxito.' })
  create(@Body() createBranchDto: CreateBranchDto) {
    return this.branchesService.create(createBranchDto);
  }

  // --- LEER TODAS (GET) [Público] ---
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'PÚBLICO: Obtiene todas las sucursales' })
  @ApiResponse({ status: 200, description: 'Lista de sucursales.' })
  findAll() {
    return this.branchesService.findAll();
  }

  // --- LEER UNA (GET /:id) [Público] ---
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'PÚBLICO: Obtiene una sucursal por ID' })
  @ApiResponse({ status: 200, description: 'Sucursal encontrada.' })
  @ApiResponse({ status: 404, description: 'Sucursal no encontrada.' })
  findOne(@Param('id') id: string) {
    return this.branchesService.findOne(id);
  }

  // --- ACTUALIZAR (PATCH /:id) [Protegido] ---
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'ADMIN: Actualiza una sucursal por ID' })
  @ApiBody({ type: UpdateBranchDto })
  @ApiResponse({ status: 200, description: 'Sucursal actualizada.' })
  @ApiResponse({ status: 404, description: 'Sucursal no encontrada.' })
  update(@Param('id') id: string, @Body() updateBranchDto: UpdateBranchDto) {
    return this.branchesService.update(id, updateBranchDto);
  }

  // --- ELIMINAR (DELETE /:id) [Protegido] ---
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT) // 204
  @ApiOperation({ summary: 'ADMIN: Elimina una sucursal por ID' })
  @ApiResponse({ status: 204, description: 'Sucursal eliminada.' })
  @ApiResponse({ status: 404, description: 'Sucursal no encontrada.' })
  remove(@Param('id') id: string) {
    return this.branchesService.remove(id);
  }
}