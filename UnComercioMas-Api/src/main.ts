import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common'; 
import { NestExpressApplication } from '@nestjs/platform-express'; // <-- 1. IMPORTAR
import { join } from 'path'; // <-- 2. IMPORTAR

async function bootstrap() {
  // --- 3. CAMBIAR TIPO DE 'app' ---
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // --- 1. AÑADIR CONFIGURACIÓN DE CORS ---
  app.enableCors({
    origin: 'http://localhost:3001', // <-- Puerto donde corre tu Next.js
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  // ------------------------------------

  // --- (Opcional) PREFIJO GLOBAL ---
  app.setGlobalPrefix('api/v1');
  // ------------------------------------

  // ----------------------------------------------------
  // Configuración de Swagger (Ya la tenías)
  // ----------------------------------------------------
  const config = new DocumentBuilder()
    .setTitle('UnComercioMas API Central Servicio Web') 
    .setDescription('Documentación de la API Headless para E-Commerce y gestión de operaciones.')
    .setVersion('1.0') 
    .addBearerAuth() 
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document); 

  // ----------------------------------------------------
  // Configuración de Validación (Pipes) (Ya la tenías)
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

  // --- 4. AÑADIR SERVIDOR DE ESTÁTICOS ---
  // Esto hace que la carpeta './uploads' sea accesible públicamente
  // en la ruta 'http://localhost:3000/uploads/...'
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });
  // ----------------------------------------
  
  await app.listen(process.env.PORT || 3000); 
  console.log(`Aplicación ejecutándose en: ${await app.getUrl()}`);
}
bootstrap();