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
import { BranchesModule } from './branches/branches.module';
import { InventoryModule } from './inventory/inventory.module';
import { OrdersModule } from './orders/orders.module';

// --- Módulo de subida de contenido ---
import { UploadsModule } from './uploads/uploads.module';

@Module({
  imports: [
    // 1️⃣ Configuración global de variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV}`], // 👈 Carga automática según el entorno
    }),

    // 2️⃣ Configuración de TypeORM
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      // ✅ Solo sincroniza en entorno local
      synchronize: process.env.NODE_ENV === 'development',
      // logging: process.env.NODE_ENV === 'development', // <-- opcional: ver SQL en consola
    }),

    // 3️⃣ Módulos principales
    UsersModule,
    AuthModule,
    SharedModule,

    // 4️⃣ Módulos del catálogo y operaciones
    CategoriesModule,
    ProductsModule,
    BranchesModule,
    InventoryModule,
    OrdersModule,

    // 5️⃣ Subida de archivos
    UploadsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
