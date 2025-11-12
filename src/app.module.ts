// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
    // 1️⃣ Configuración global de variables de entorno (¡Ajuste para Robustez!)
    ConfigModule.forRoot({
  isGlobal: true,
  // 💡 Aplicar la corrección que funcionó en el servidor:
  //envFilePath: ['.env.production', '.env'],
  envFilePath: ['.env.development', '.env.production', '.env'],
    }),

    // 2️⃣ Configuración de TypeORM usando async para asegurar strings
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: Number(config.get<number>('DB_PORT')),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'), // 🔹 fuerza string
        database: config.get<string>('DB_NAME'),
        autoLoadEntities: true,
        // Sincronizar (crear/actualizar tablas) SOLO en desarrollo
        synchronize: config.get<string>('NODE_ENV') === 'development',
      }),
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