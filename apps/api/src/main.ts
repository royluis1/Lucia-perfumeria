import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(helmet());
  app.useStaticAssets(join(process.cwd(), process.env.UPLOADS_DIR?.trim() || 'public'), {
    prefix: process.env.UPLOADS_PREFIX?.trim() || '/uploads',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const configuredOrigins = (process.env.API_CORS_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({
    origin: configuredOrigins.length === 1 ? configuredOrigins[0] : configuredOrigins,
    credentials: true,
  });

  const port = Number(process.env.PORT ?? 3001);
  const host = process.env.HOST ?? '127.0.0.1';

  app.enableShutdownHooks();
  await app.listen(port, host);
  console.log(`Backend corriendo en http://${host}:${port}`);
}
bootstrap();