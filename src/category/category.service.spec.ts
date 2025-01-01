import { Test, TestingModule } from '@nestjs/testing';
import { CategoryService } from './category.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Category } from './category.entity';
import { CustomLoggerService } from '../logger/logger.service';
import { ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CreateCategoryDto } from './dto/create-category.dto';
import { validate } from 'class-validator';

describe('CategoryService', () => {
  let service: CategoryService;
  let repository: Repository<Category>;
  let logger: CustomLoggerService;

  beforeEach(async () => {
    // Mock logger
    const mockLogger = {
      setContext: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: getRepositoryToken(Category),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: CustomLoggerService,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
    repository = module.get<Repository<Category>>(getRepositoryToken(Category));
    logger = module.get<CustomLoggerService>(CustomLoggerService);
  });

  describe('create', () => {
    const createCategoryDto = {
      name: 'test-category',
      label: 'Test Category',
    };

    it('should successfully create a category', async () => {
      // Given
      const expectedResult = new Category();
      expectedResult.name = createCategoryDto.name;
      expectedResult.label = createCategoryDto.label;

      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      jest.spyOn(repository, 'save').mockResolvedValue(expectedResult);

      // When
      const result = await service.create(createCategoryDto);

      // Then
      expect(result).toEqual(expectedResult);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { name: createCategoryDto.name },
      });
      expect(repository.save).toHaveBeenCalled();
      expect(logger.warn).not.toHaveBeenCalled();
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if category with same name exists', async () => {
      // Given
      const existingCategory = new Category();
      jest.spyOn(repository, 'findOne').mockResolvedValue(existingCategory);

      // When & Then
      await expect(service.create(createCategoryDto)).rejects.toThrow(
        ConflictException,
      );
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { name: createCategoryDto.name },
      });
      expect(logger.warn).toHaveBeenCalledWith(
        `category CREATE - Attempted to create duplicate name: ${createCategoryDto.name}`,
      );
    });

    it('should validate that name and label are strings', async () => {
      // Given
      const dto = new CreateCategoryDto();
      Object.assign(dto, { name: 123, label: 456 });

      // When & Then
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should handle unknown errors during creation', async () => {
      // Given
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      jest
        .spyOn(repository, 'save')
        .mockRejectedValue(new Error('Database error'));

      // When & Then
      await expect(service.create(createCategoryDto)).rejects.toThrow(
        '카테고리 생성에 오류가 발생했습니다.',
      );
      expect(logger.error).toHaveBeenCalledWith(
        'category CREATE',
        expect.any(String),
      );
    });

    it('should validate name length is not more than 50 characters', async () => {
      // Given
      const dto = new CreateCategoryDto();
      Object.assign(dto, {
        name: 'a'.repeat(51),
        label: 'Test Category',
      });

      // When & Then
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should not allow empty name or label', async () => {
      // Given
      const dto = new CreateCategoryDto();
      Object.assign(dto, {
        name: '',
        label: '',
      });

      // When & Then
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
