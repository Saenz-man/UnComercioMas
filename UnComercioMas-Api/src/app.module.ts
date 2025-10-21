import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config'; // Necesario para leer .env
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module'; // Importamos tu módulo de usuarios
import { AuthModule } from './auth/auth.module';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    // 1. Módulo para la configuración (leer archivos .env)
    ConfigModule.forRoot({
      isGlobal: true, // Hace que las variables de entorno estén disponibles globalmente
    }),
    
    // 2. Módulo de TypeORM para PostgreSQL
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST, // Lee desde variables de entorno
      port: +process.env.DB_PORT!, // El '+' convierte la cadena a número
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true, // Carga automáticamente las entidades (como User.entity.ts)
      synchronize: true, // SOLO USAR EN DESARROLLO: Sincroniza la estructura de la DB con las entidades.
      // entities: [User], // Alternativamente, lista tus entidades aquí.
    }),

    // Tus Módulos
    UsersModule,
    AuthModule,
    SharedModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}