import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CustomLoggerService } from '../logger/logger.service';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext(CategoryService.name);
  }

  async create({ name, label }: CreateCategoryDto): Promise<Category> {
    try {
      const existingCategory = await this.categoryRepository.findOne({
        where: { name },
      });
      if (existingCategory) {
        this.logger.warn(
          `category CREATE - Attempted to create duplicate name: ${name}`,
        );
        throw new ConflictException('같은 이름의 카테고리가 있습니다.');
      }

      const category = new Category();
      category.name = name;
      category.label = label;

      await this.categoryRepository.save(category);
      return category;
    } catch (error) {
      this.logger.error('category CREATE', error.stack);
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new Error('카테고리 생성에 오류가 발생했습니다.');
    }
  }
}
