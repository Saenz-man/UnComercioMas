// src/main.ts

import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { apiReference } from '@scalar/nestjs-api-reference'; // <-- IMPORTAR
import { NestExpressApplication } from '@nestjs/platform-express'; // <-- IMPORTAR
import { join } from 'path'; // <-- IMPORTAR

async function bootstrap() {
  // --- Usar NestExpressApplication ---
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // --- Configuración de CORS ---
  app.enableCors({
    origin: 'http://localhost:3001', // <-- Puerto donde corre tu Next.js
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // --- PREFIJO GLOBAL ---
  // (Debe ir ANTES de la documentación para que se genere correctamente)
  app.setGlobalPrefix('api/v1');

  // ----------------------------------------------------
  // --- CONFIGURACIÓN DE DOCUMENTACIÓN ---
  // ----------------------------------------------------
  const config = new DocumentBuilder()
    .setTitle('UnComercioMas API Central')
    .setDescription('Documentación de la API Headless para E-Commerce y gestión de operaciones.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // --- Opción 1: Documentación con Swagger UI ---
  // Se usa el prefijo global, la ruta será /api/v1/docs
  SwaggerModule.setup('api/docs', app, document); // Correcto

  // --- Opción 2: Documentación con Scalar ---
  // Para Scalar, usamos app.use, que no hereda el prefijo global.
  // Por eso, especificamos la ruta completa.
  app.use('/api/scalar', apiReference({ // Correcto
    // @ts-ignore  <-- Ignoramos el error de tipos de TypeScript
    spec: { content: document },
    theme: 'deepSpace',
  }));
  // ----------------------------------------------------

  // ----------------------------------------------------
  // Configuración de Validación (Pipes)
  // ----------------------------------------------------
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  // ----------------------------------------------------

  // --- SERVIDOR DE ESTÁTICOS ---
  // (Para la carpeta ./uploads)
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });
  // ----------------------------------------

  // --- Iniciar la aplicación ---
  // CAMBIO HECHO AQUÍ: Forzamos el puerto 3000
  await app.listen(3000);
  console.log(`Aplicación ejecutándose en: ${await app.getUrl()}`);
}
bootstrap();