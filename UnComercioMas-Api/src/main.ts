// src/main.ts
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'; // Importaciones de Swagger
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ----------------------------------------------------
  // Configuración de Swagger
  // ----------------------------------------------------
  const config = new DocumentBuilder()
    .setTitle('UnComercioMas API Central') // Nombre del Negocio
    .setDescription('Documentación de la API Headless para E-Commerce y gestión de operaciones.')
    .setVersion('1.0') // Versión del Plan de Desarrollo
    .addBearerAuth() // Añade soporte para JWT (Autenticación)
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document); // La documentación estará disponible en /api/docs

  // ----------------------------------------------------
  
  await app.listen(process.env.PORT || 3000); // Lee el puerto de entorno
  console.log(`Aplicación ejecutándose en: ${await app.getUrl()}`);
}
bootstrap();