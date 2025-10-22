// src/main.ts
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common'; // <-- 1. IMPORTAR VALIDATION PIPE

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ----------------------------------------------------
  // Configuración de Swagger
  // ----------------------------------------------------
  const config = new DocumentBuilder()
    .setTitle('UnComercioMas API Central') 
    .setDescription('Documentación de la API Headless para E-Commerce y gestión de operaciones.')
    .setVersion('1.0') 
    .addBearerAuth() 
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document); // La documentación estará disponible en /api/docs

  // ----------------------------------------------------
  // --- 2. CONFIGURACIÓN DE VALIDACIÓN GLOBAL (PIPES) ---
  // (Este es el bloque que faltaba)
  // ----------------------------------------------------
  app.useGlobalPipes(
    new ValidationPipe({
      // whitelist: true
      // Ignora silenciosamente las propiedades que no están definidas en el DTO.
      whitelist: true, 
      
      // forbidNonWhitelisted: true
      // Lanza un error si se envían propiedades que no están en el DTO. (¡Muy bueno para seguridad!)
      forbidNonWhitelisted: true, 
      
      // transform: true
      // ¡EL MÁS IMPORTANTE PARA TI AHORA!
      // Transforma el payload JSON (objetos planos) a instancias de nuestras clases DTO.
      // Esto es lo que permite que @Type(() => CreateVolumePriceDto) funcione.
      transform: true, 

      transformOptions: {
        // Permite que el pipe intente convertir tipos automáticamente (ej. un query param "123" a un number 123)
        enableImplicitConversion: true,
      },
    }),
  );
  // ----------------------------------------------------
  
  await app.listen(process.env.PORT || 3000); // Lee el puerto de entorno
  console.log(`Aplicación ejecutándose en: ${await app.getUrl()}`);
}
bootstrap();