import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
// Ya no necesitamos 'existsSync', 'cpSync' ni 'fs'
import { join } from 'path'; 
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  const env = configService.get<string>('NODE_ENV') || 'development';
  const isProd = env === 'production';

  // Asumiendo que has configurado CORS aquí previamente
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true,
  });

  // --- CONFIGURACIÓN DE SWAGGER ---

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

  // --- SOLUCIÓN CRÍTICA: USAR CDN PARA ARCHIVOS ESTÁTICOS ---

  // ⚠️ IGNORAR la configuración de static assets para Swagger (ya no se necesitan)
  // app.useStaticAssets(distSwaggerPath, { prefix: '/api/docs/' }); 

  SwaggerModule.setup('api/docs', app, document, {
    // 💡 Usamos CDN para eliminar los errores 404 en producción
    customJs: [
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.11.0/swagger-ui-bundle.js',
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js',
    ],
    customCssUrl: 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.11.0/swagger-ui.css',
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
  // ------------------------------------------------------------------

  // --- CONFIGURACIÓN DE ARCHIVOS DE SUBIDA (UPLOADS) ---
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // --- INICIO ---
  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);

  console.log(`🚀 API corriendo en puerto ${port}`);
  console.log(`🌐 Swagger disponible en: /api/docs`);
  console.log(`🧩 Entorno actual: ${env.toUpperCase()}`);
}
bootstrap();