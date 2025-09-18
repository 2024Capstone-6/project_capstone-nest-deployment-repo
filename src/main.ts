import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express'; // ✅ 추가
import { join } from 'path'; // ✅ 추가
import * as cookieParser from 'cookie-parser'; // ✅ 추가

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });
  app.use(cookieParser());

  app.setGlobalPrefix('api');

  // ✅ 정적 파일 제공 설정 (mp3 등)
  app.useStaticAssets(join(__dirname, '..'), {
    prefix: '/audio/',
  });

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
