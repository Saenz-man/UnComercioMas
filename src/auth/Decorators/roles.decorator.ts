// src/auth/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../users/entities/user.entity';

// La llave que usará NestJS para guardar los roles en los metadatos de la ruta
export const ROLES_KEY = 'roles';

/**
 * Decorador para definir los roles permitidos en un endpoint (ej. @Roles(UserRole.ADMIN))
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);