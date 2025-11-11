import { join } from 'path';
import { existsSync, cpSync } from 'fs';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  const env = configService.get<string>('NODE_ENV') || 'development';
  const isProd = env === 'production';

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

  // --- Copiar los archivos de swagger-ui-dist si no están ---
  const distSwaggerPath = join(__dirname, 'swagger-ui-dist');
  const nodeSwaggerPath = join(process.cwd(), 'node_modules', 'swagger-ui-dist');

  if (!existsSync(distSwaggerPath) && existsSync(nodeSwaggerPath)) {
    console.log('📦 Copiando assets de Swagger UI al build...');
    cpSync(nodeSwaggerPath, distSwaggerPath, { recursive: true });
  }

  // --- Servir los assets directamente bajo /api/docs ---
  app.useStaticAssets(distSwaggerPath, {
    prefix: '/api/docs/', // 👈 AHORA Swagger busca directamente aquí
  });

  // --- Configurar Swagger UI ---
  SwaggerModule.setup('api/docs', app, document, {
    customJs: [
      '/api/docs/swagger-ui-bundle.js',
      '/api/docs/swagger-ui-standalone-preset.js',
    ],
    customCssUrl: '/api/docs/swagger-ui.css',
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);

  console.log(`🚀 API corriendo en puerto ${port}`);
  console.log(`🌐 Swagger disponible en: /api/docs`);
  console.log(`🧩 Entorno actual: ${env.toUpperCase()}`);
}
bootstrap();
