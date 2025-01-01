import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { CustomLoggerModule } from '../logger/logger.module';
import { Category } from './category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Category]), CustomLoggerModule],
  providers: [CategoryService],
  controllers: [CategoryController],
})
export class CategoryModule {}
