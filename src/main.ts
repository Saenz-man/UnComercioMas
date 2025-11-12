import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path'; 
import { AppModule } from './app.module';

// --- IMPORTS PARA EL TÚNEL SSH ---
const { Client } = require('ssh2'); 
const dotenv = require('dotenv'); // Usamos require() para compatibilidad

// --- FUNCIÓN DEL TÚNEL SSH (Solo para uso local) ---
function createSshTunnel() {
  const client = new Client();
  return new Promise<void>((resolve, reject) => {
    
    // 1. Conexión SSH al VPS
    client.connect({
      host: '31.220.61.119', // IP del VPS
      port: 22,
      username: 'root', // Usuario del VPS
      password: 'PapasAlaFrancesa1+', // ⚠️ Contraseña de root (solo para desarrollo local)
    });

    client.on('ready', () => {
      // 2. Creación del Túnel (Redirección de localhost:5432)
      client.forwardOut(
        '127.0.0.1', 5432, // Source: Donde la aplicación local espera la conexión
        '127.0.0.1', 5432, // Destination: Donde Postgre está escuchando en el VPS
        (err: any, stream: any) => {
          if (err) {
            console.error('❌ Error en el forwarding del túnel:', err);
            client.end();
            return reject(err);
          }
          console.log('✅ Túnel SSH a BD de Hostinger establecido.');
          resolve();
        },
      );
    }).on('error', (err: any) => {
      console.error('❌ Error de conexión SSH al VPS:', err.message);
      reject(err);
    });
  });
}
// ------------------------------------------------------------------

async function bootstrap() {
  
  // 1. Cargar la configuración de ambiente (Production o Development)
  const env = process.env.NODE_ENV || 'development';
  const isProd = env === 'production';

  // 2. Cargar el archivo .env (Crucial para TypeOrmModule)
  if (isProd) {
    // Si es producción, carga el archivo de producción
    dotenv.config({ path: '.env.production' });
  } else {
    // Si es desarrollo, carga el archivo de desarrollo (con fallback)
    dotenv.config({ path: '.env.development' }); 
  }
  
  // --- EJECUCIÓN DEL TÚNEL SSH (SOLO EN DESARROLLO) ---
  if (!isProd) { // o env === 'development'
    await createSshTunnel(); 
  }
  // --------------------------------------------------
  
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  // 'env' y 'isProd' ya fueron definidos arriba

  // --- CONFIGURACIÓN DE CORS ---
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true,
  });

  // --- CONFIGURACIÓN DE SWAGGER (CDN) ---
  const swaggerTitle = isProd
    ? 'UnComercioMas API Web - Salimos a Produccion'
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

  SwaggerModule.setup('api/docs', app, document, {
    // Usamos CDN para que funcione siempre
    customJs: [
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.11.0/swagger-ui-bundle.js',
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js',
    ],
    customCssUrl: 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.11.0/swagger-ui.css',
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

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