// src/uploads/uploads.module.ts
import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
// Opcional: Si necesitas MulterModule aquí (generalmente se registra globalmente o en AppModule)
// import { MulterModule } from '@nestjs/platform-express';

@Module({
  // Opcional: Si Multer no está global, regístralo aquí
  // imports: [
  //   MulterModule.register({
  //     dest: './uploads', // Directorio por defecto si no se configura en diskStorage
  //   }),
  // ],
  controllers: [UploadsController], // Declara el controlador para que NestJS lo reconozca
  // providers: [], // Añade un UploadsService si lo necesitas
})
export class UploadsModule {}