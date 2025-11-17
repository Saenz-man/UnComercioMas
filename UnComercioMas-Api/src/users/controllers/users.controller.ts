// src/users/controllers/users.controller.ts
import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { UserRole } from '../entities/user.entity';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';

@ApiTags('Usuarios')
@Controller('users')
export class UsersController {
  // Nota: Debemos inyectar UsersCoreService aquí para los métodos CRUD

  // Tarea S1.10: Endpoint de prueba protegido para Administradores
  @Get('admin-test')
  @UseGuards(AuthGuard('jwt'), RolesGuard) // 1. Verifica token, 2. Verifica rol
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN) // Solo estos roles tienen acceso
  @ApiBearerAuth() // Muestra el candado en Swagger
  @ApiOperation({ summary: 'PRUEBA: Obtiene el perfil del usuario autenticado (Solo Admin/Superadmin)' })
  getAdminProfile(@Request() req) {
    // Si llega aquí, el usuario es un Admin/Superadmin con token válido.
    return {
      message: 'Acceso Exitoso: Ruta de Administración',
      user: req.user, // Contiene id, email, rol, etc., gracias al JwtStrategy
    };
  }
}