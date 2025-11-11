import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // --- Determinar entorno ---
  const env = configService.get<string>('NODE_ENV') || 'development';
  const isProd = env === 'production';

  // --- Configuración Swagger dinámica ---
  const swaggerTitle = isProd
    ? 'UnComercioMas API Central Servicio Web'
    : 'UnComercioMas API Local - Entorno de Desarrollo';

  const swaggerDescription = isProd
    ? 'Documentación de la API Headless para E-Commerce y gestión de operaciones.'
    : 'Documentación local para pruebas y desarrollo de UnComercioMas.';

  const swaggerConfig = new DocumentBuilder()
    .setTitle(swaggerTitle)
    .setDescription(swaggerDescription)
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  // --- ⚙️ SERVIR ARCHIVOS ESTÁTICOS DE SWAGGER ---
  // Esto evita los errores 404 de swagger-ui.css y swagger-ui-bundle.js
  app.useStaticAssets(join(__dirname, '..', 'node_modules', 'swagger-ui-dist'));

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customCss: '.swagger-ui .topbar { display: none }',
  });

  // --- Iniciar servidor ---
  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);

  console.log('🚀 API iniciado correctamente');
  console.log(`🌐 API corriendo en: http://localhost:${port}/api/docs`);
  console.log(`🗄️ Conectando a BD: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
  console.log(`🧩 Entorno actual: ${env.toUpperCase()}`);
}
bootstrap();
