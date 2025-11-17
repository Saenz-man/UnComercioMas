// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// --- Módulos del Core (Sprint 1) ---
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { SharedModule } from './shared/shared.module';

// --- Módulos del Catálogo (Sprint 2) ---
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';

// --- Módulos de Operaciones (Sprint 2 y 3) ---
import { BranchesModule } from './branches/branches.module'; // <-- ÚNICA importación de branches
import { InventoryModule } from './inventory/inventory.module';
import { OrdersModule } from './orders/orders.module';
// ----Módulo de subida de contenido ------
import { UploadsModule } from './uploads/uploads.module'; // 👈 Importamos el módulo de Uploads
// --- Módulo de acciones del Admin---
import { AdminModule } from './admin/admin.module'; // <-- IMPORTAR EL MÓDULO DE ADMIN

@Module({
  imports: [
    // 1. Configuración Global (Lee .env)
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // 2. Conexión a PostgreSQL (TypeORM)
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT!,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: true, // SOLO EN DESARROLLO
    }),

    // Módulos del Sprint 1
    UsersModule,
    AuthModule,
    SharedModule,

    // Módulos del Sprint 2 y 3 (Catálogo, Inventario, Pedidos)
    CategoriesModule,
    ProductsModule,
    BranchesModule, // <-- Se queda aquí
    InventoryModule,
    OrdersModule,
    //Nuevo modelo
    UploadsModule, // 👈 Añadido aquí para registrar el controlador de uploads
    AdminModule, // <-- IMPORTAR EL MÓDULO DE ADMIN
  ],
  controllers: [AppController], // <-- Limpiado
  providers: [AppService],      // <-- Limpiado
})
export class AppModule { }