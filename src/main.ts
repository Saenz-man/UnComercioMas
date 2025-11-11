import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

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

  // --- ⚙️ Servir archivos estáticos Swagger desde node_modules ---
  const swaggerDistPath = join(__dirname, '..', 'node_modules', 'swagger-ui-dist');
  app.useStaticAssets(swaggerDistPath, {
    prefix: '/swagger-ui-dist/', // 👈 Importante para que Swagger cargue correctamente
  });

  SwaggerModule.setup('api/docs', app, document, {
    customJs: [
      '/swagger-ui-dist/swagger-ui-bundle.js',
      '/swagger-ui-dist/swagger-ui-standalone-preset.js',
    ],
    customCssUrl: '/swagger-ui-dist/swagger-ui.css',
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);

  console.log(`🚀 API corriendo en puerto ${port}`);
  console.log(`🌐 Swagger disponible en: /api/docs`);
  console.log(`🗄️ Conectando a BD: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
  console.log(`🧩 Entorno actual: ${env.toUpperCase()}`);
}
bootstrap();
