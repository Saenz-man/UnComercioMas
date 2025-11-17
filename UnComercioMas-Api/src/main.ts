import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common'; // <-- RECUPERADO
import { apiReference } from '@scalar/nestjs-api-reference'; // <-- RECUPERADO
import { join } from 'path';
import { AppModule } from './app.module';
import * as net from 'net'; // <--- IMPORTANTE: Añadir esto

// --- IMPORTS PARA EL TÚNEL SSH ---
const { Client } = require('ssh2');
const dotenv = require('dotenv');


// --- FUNCIÓN DEL TÚNEL SSH (CORREGIDA CON SERVIDOR NET) ---
function createSshTunnel() {
  const client = new Client();

  return new Promise<void>((resolve, reject) => {
    const sshConfig = {
      host: process.env.VPS_HOST,
      port: parseInt(process.env.VPS_PORT || '22'),
      username: process.env.VPS_USER,
      password: process.env.VPS_PASSWORD,
    };

    // Puerto local donde TypeORM intentará conectar (ej: 5433)
    const localPort = parseInt(process.env.DB_PORT || '5432');
    // Puerto remoto de la BD en el VPS (siempre es 5432 para Postgres)
    const remotePort = 5432;

    console.log(`🔌 Iniciando conexión SSH a ${sshConfig.host}...`);

    client.on('ready', () => {
      console.log('🔑 Autenticación SSH exitosa.');

      // CREAMOS UN SERVIDOR LOCAL QUE ESCUCHA EN TU PC
      const server = net.createServer((socket) => {

        // Cuando TypeORM se conecta a este servidor local, abrimos el canal SSH
        client.forwardOut(
          '127.0.0.1', 0, // Origen (dinámico)
          '127.0.0.1', remotePort, // Destino en el VPS
          (err, stream) => {
            if (err) {
              console.error('❌ Error al reenviar conexión:', err);
              socket.end();
              return;
            }
            // CONECTAMOS ("Tubería") la conexión local con el túnel SSH
            socket.pipe(stream);
            stream.pipe(socket);
          }
        );
      });

      // Ponemos el servidor a escuchar en el puerto local (5433)
      server.listen(localPort, '127.0.0.1', () => {
        console.log(`✅ Túnel listo: localhost:${localPort} <==SSH==> VPS:${remotePort}`);
        resolve(); // ¡Ahora sí resolvemos la promesa!
      });

      server.on('error', (err) => {
        console.error('❌ Error en el servidor local del túnel:', err);
        reject(err);
      });

    }).on('error', (err: any) => {
      console.error('❌ Error de conexión SSH (Handshake):', err.message);
      reject(err);
    });

    // Iniciar la conexión
    client.connect(sshConfig);
  });
}


async function bootstrap() {
  // 1. Cargar configuración de entorno MANUALMENTE (para el túnel antes de Nest)
  const env = process.env.NODE_ENV || 'development';
  const isProd = env === 'production';

  if (isProd) {
    dotenv.config({ path: '.env.production' });
  } else {
    const result = dotenv.config({ path: '.env.development' });
    if (result.error) {
      console.error("❌ Error leyendo .env.development:", result.error); // <--- DEBUG
    }
  }

  // <--- DEBUG: Verificamos si leyó las variables
  console.log("Variables detectadas:");
  console.log(" - VPS_HOST:", process.env.VPS_HOST);
  console.log(" - NODE_ENV:", process.env.NODE_ENV);

  // 2. EJECUCIÓN DEL TÚNEL SSH (SOLO EN DESARROLLO LOCAL)
  // Si estás en local y necesitas conectar a la BD del VPS
  // if (!isProd && process.env.VPS_HOST) {
  // 2. EJECUCIÓN DEL TÚNEL SSH
  // Quitamos temporalmente la validación estricta para forzar el intento y ver errores
  if (!isProd) {
    console.log("🚀 Iniciando intento de túnel..."); // <--- DEBUG
    try {
      await createSshTunnel();
    } catch (error) {
      console.error("⚠️ FALLÓ EL TÚNEL, la BD no conectará.");
    }
  }
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // --- CONFIGURACIÓN DE CORS ---
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true,
  });

  // ----------------------------------------------------
  // --- DOCUMENTACIÓN (SWAGGER + SCALAR) ---
  // ----------------------------------------------------
  const swaggerTitle = isProd
    ? 'UnComercioMas API Web - Produccion'
    : 'UnComercioMas API Local';

  const swaggerConfig = new DocumentBuilder()
    .setTitle(swaggerTitle)
    .setDescription('Documentación de la API Headless.')
    .setVersion('1.0')
    .addBearerAuth()
    .addServer('/api/v1', 'Global API Prefix') // <-- SOLUCIÓN
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  // 1. Swagger UI (Clásico)
  SwaggerModule.setup('api/docs', app, document, {
    customJs: [
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.11.0/swagger-ui-bundle.js',
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js',
    ],
    customCssUrl: 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.11.0/swagger-ui.css',
    swaggerOptions: { persistAuthorization: true },
  });

  // 2. Scalar (Moderno) - RECUPERADO
  app.use('/api/scalar', apiReference({
    // @ts-ignore
    spec: { content: document },
    theme: 'deepSpace'
  }));

  // ----------------------------------------------------
  // --- PREFIJO GLOBAL Y PIPES ---
  // ----------------------------------------------------

  // Importante: Prefijo después de las docs para no afectarlas
  app.setGlobalPrefix('api/v1');

  // Validación Global - RECUPERADO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // --- ARCHIVOS ESTÁTICOS ---
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // --- INICIO ---
  const port = configService.get<number>('PORT') || 3000;

  // Forzamos escucha en 0.0.0.0 por si usas Docker/VPS en el futuro, o localhost por defecto
  await app.listen(port);

  console.log(`\n🚀 API corriendo en: ${await app.getUrl()}`);
  console.log(`🌐 Swagger: ${await app.getUrl()}/api/docs`);
  console.log(`⚡ Scalar:  ${await app.getUrl()}/api/scalar`);
  console.log(`🧩 Entorno: ${env.toUpperCase()}\n`);
}
bootstrap();