import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  Post,
  Req,
  Body
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
import { CreatePosOrderDto } from './DTO/create-pos-order.dto';
// --- FIN DE IMPORTS ---


@ApiTags('Pedidos (Orders/POS)')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

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

  // --- ENDPOINT POS ---
  // POST /api/v1/orders/pos
  @Post('pos')
  @Roles(UserRole.VENDEDOR, UserRole.ADMIN, UserRole.SUPERADMIN) // Vendedores pueden vender
  @ApiOperation({ summary: 'POS: Registrar una nueva venta (descuenta stock)' })
  async createPosOrder(@Req() req, @Body() dto: CreatePosOrderDto) {
    // Obtenemos al usuario (vendedor) desde el token JWT
    // El usuario ya debe venir con la relación 'sucursal' cargada gracias a tu UsersService
    const user = req.user;
    return this.ordersService.createPosOrder(user, dto);
  }
}