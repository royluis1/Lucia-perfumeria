import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Habilitamos CORS para que tu frontend en Next.js pueda hacerle peticiones
  app.enableCors(); 
  
  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  console.log(`Backend corriendo en http://localhost:${port}`);
}
bootstrap();