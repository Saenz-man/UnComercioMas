// src/auth/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    // 1. Obtener los roles requeridos de los metadatos del endpoint (usando @Roles())
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(), // Intenta leer el decorador en el método
      context.getClass(),   // Intenta leer el decorador en la clase (Controller)
    ]);

    // Si no hay roles definidos (@Roles() no usado), el acceso es libre (o lo maneja otro Guard)
    if (!requiredRoles) {
      return true;
    }

    // 2. Obtener el usuario del token (req.user)
    const { user } = context.switchToHttp().getRequest();

    // NUEVA VERIFICACIÓN: Si el usuario no está autenticado o no tiene rol (de la DB), denegar acceso.
    // Esto previene errores de "Cannot read properties of undefined"
    if (!user || !user.rol) {
      return false;
    }

    // 3. Candado de Autorización: Comprobar si el rol del usuario está en la lista de roles requeridos
    // Esto asegura que, por ejemplo, un 'cliente' no pueda acceder a rutas de 'admin'.
    return requiredRoles.some((requiredRole) => user.rol.toLowerCase() === requiredRole.toLowerCase());
  }
}