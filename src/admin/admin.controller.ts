import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { RegisterDto } from '../auth/DTO/register.dto';
import { AssignBranchDto } from './DTO/assign-branch.dto';
import { JwtAuthGuard } from '../auth/Guards/jwt-auth.guard';
import { RolesGuard } from '../auth/Guards/roles.guard';
import { Roles } from '../auth/Decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('ADMIN - Gestión de Vendedores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    // ELIMINADO: createAdmin (Se hace por BD manual)

    // --- CREAR VENDEDOR ---
    @Post('vendedores')
    @ApiOperation({ summary: 'Registrar un nuevo Vendedor' })
    async createVendedor(@Body() dto: RegisterDto) {
        // 1. Ejecutar la lógica de creación
        const user = await this.adminService.createVendedor(dto);

        // 2. Limpiar la respuesta antes de devolverla
        const { hash_contrasena, ...result } = user;
        return result; // <--- Devolver solo los campos seguros
    }

    // --- 6. ASIGNAR SUCURSAL A VENDEDOR ---
    // Endpoint: POST /api/v1/admin/vendedores/asignar
    @Post('vendedores/asignar')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Asignar una sucursal a un vendedor' })
    @ApiBody({ type: AssignBranchDto })
    assignBranch(@Body() dto: AssignBranchDto) {
        return this.adminService.assignBranch(dto);
    }

    // --- LISTAR VENDEDORES ---
    @Get('vendedores')
    @ApiOperation({ summary: 'Consultar todos los vendedores activos' })
    findAllVendedores() {
        return this.adminService.findAllVendedores();
    }

    // --- ACTUALIZAR VENDEDOR ---
    @Patch('vendedores/:id')
    @ApiOperation({ summary: 'Actualizar datos de un vendedor' })
    updateVendedor(@Param('id') id: string, @Body() dto: any) { // Define un DTO específico si puedes
        return this.adminService.updateVendedor(id, dto);
    }

    // --- ELIMINAR VENDEDOR ---
    @Delete('vendedores/:id')
    @ApiOperation({ summary: 'Desactivar un vendedor' })
    removeVendedor(@Param('id') id: string) {
        return this.adminService.removeVendedor(id);
    }
}