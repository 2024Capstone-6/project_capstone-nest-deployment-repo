import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn', 'debug', 'verbose'] });

  app.enableCors({
    origin: true, //'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
