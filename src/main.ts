import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // --- Determinar entorno ---
  const env = configService.get<string>('NODE_ENV') || 'development';

  // --- Configurar título y descripción dinámicos ---
  const isProd = env === 'production';

  const swaggerTitle = isProd
    ? 'UnComercioMas API Central Servicio Web'
    : 'UnComercioMas API Local - Entorno de Desarrollo';

  const swaggerDescription = isProd
    ? 'Documentación de la API Headless para E-Commerce y gestión de operaciones.'
    : 'Documentación local para pruebas y desarrollo de UnComercioMas.';

  // --- Configuración Swagger ---
  const swaggerConfig = new DocumentBuilder()
    .setTitle(swaggerTitle)
    .setDescription(swaggerDescription)
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // --- Iniciar servidor ---
  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);

  console.log('🚀 API iniciado correctamente');
  console.log(`🌐 API corriendo en: http://localhost:${port}/api/docs`);
  console.log(`🗄️ Conectando a BD: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
  console.log(`🧩 Entorno actual: ${env.toUpperCase()}`);

}
bootstrap();
