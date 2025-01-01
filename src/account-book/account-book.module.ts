import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountBookController } from './account-book.controller';
import { AccountBookService } from './account-book.service';
import { CustomLoggerModule } from '../logger/logger.module';
import { AccountBook } from './account-book.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AccountBook]), CustomLoggerModule],
  controllers: [AccountBookController],
  providers: [AccountBookService],
})
export class AccountBookModule {}
