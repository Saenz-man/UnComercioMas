import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

import { AppModule } from './app.module';
// Ya no necesitamos 'existsSync' ni 'cpSync'
// Ya no necesitamos la importación de 'fs'

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

  // --- SOLUCIÓN: Usar CDN para assets estáticos (Funciona en todos los entornos) ---
  
  // 🚫 ELIMINAMOS TODO EL CÓDIGO DE COPIADO DE ARCHIVOS LOCALES 🚫
  
  // --- Configuración de Swagger ---
  SwaggerModule.setup('api/docs', app, document, {
    // 💡 APUNTAMOS DIRECTAMENTE AL CDN DE SWAGGER 💡
    customJs: [
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.11.0/swagger-ui-bundle.js',
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js',
    ],
    customCssUrl: 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.11.0/swagger-ui.css',
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
  // ---------------------------------------------------------------------------------

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);

  // El resto de la configuración de logs es correcta.
  console.log(`🚀 API corriendo en puerto ${port}`);
  console.log(`🌐 Swagger disponible en: /api/docs`);
  console.log(`🗄️ Conectando a BD: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
  console.log(`🧩 Entorno actual: ${env.toUpperCase()}`);
}
bootstrap();