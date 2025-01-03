import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import 'dotenv/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { CustomLoggerModule } from './logger/logger.module';
import { AuthModule } from './auth/auth.module';
import { PaymentMethodModule } from './payment-method/payment-method.module';
import { CategoryModule } from './category/category.module';
import { AccountBookModule } from './account-book/account-book.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: parseInt(process.env.MYSQL_PORT),
      username: process.env.MYSQL_USER_NAME,
      password: process.env.MYSQL_USER_PASSWORD,
      database: process.env.MYSQL_DATABASE_NAME,
      autoLoadEntities: true,
      synchronize: true,
    }),
    UsersModule,
    CustomLoggerModule,
    AuthModule,
    PaymentMethodModule,
    CategoryModule,
    AccountBookModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
