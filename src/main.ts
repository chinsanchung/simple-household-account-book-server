import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { CustomLoggerService } from './logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // 입력된 데이터를 DTO 클래스의 인스턴스로 자동 변환
      whitelist: true, // DTO에 정의되지 않은 속성은 자동으로 제거
      forbidNonWhitelisted: true, // DTO에 정의되지 않은 속성이 있으면 요청 자체를 거부
    }),
  );
  app.useLogger(app.get(CustomLoggerService));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
