import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import 'dotenv/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Swagger config
  const config = new DocumentBuilder()
    .setTitle('Food API')
    .setDescription('API quản lý món ăn')
    .setVersion('1.0')
    .addTag('foods')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, document);

  // Fix bug chặn CORS khi call api từ brower khác origin
  app.enableCors({
    origin: 'http://localhost:3000',
  },);

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
