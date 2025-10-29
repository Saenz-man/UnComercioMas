// En src/orders/orders.controller.ts

// --- IMPORTS NECESARIOS ---
import { 
  Controller, 
  Get, 
  Query, 
  UseGuards, 
  ParseIntPipe, 
  DefaultValuePipe 
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiBearerAuth, 
  ApiOperation, 
  ApiQuery, 
  ApiResponse 
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { OrdersService } from './orders.service';
import { RolesGuard } from '../auth/Guards/roles.guard';
import { Roles } from '../auth/Decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
// --- FIN DE IMPORTS ---


@ApiTags('Admin / Dashboard / Orders') 
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('orders') 
export class OrdersController { 
  constructor(private readonly ordersService: OrdersService) {}

  // Endpoint para órdenes recientes (ahora bajo /orders/admin/recent-orders)
  @Get('admin/recent-orders') 
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'ADMIN: Obtiene las últimas órdenes para el dashboard' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Número de órdenes a obtener (default: 5)' })
  @ApiResponse({ status: 200, description: 'Lista de órdenes recientes.' })
  async getRecentOrders(
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
  ) {
    // Asegúrate de que ordersService tenga el método findRecentOrders
    return this.ordersService.findRecentOrders(limit); 
  }

  // --- AQUÍ PUEDES AÑADIR LOS OTROS ENDPOINTS DE ÓRDENES ---
  // Ej: POST /orders, GET /orders/{id}, etc.
}