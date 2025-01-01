import { Test, TestingModule } from '@nestjs/testing';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { Category } from './category.entity';
import { ConflictException } from '@nestjs/common';

describe('CategoryController', () => {
  let controller: CategoryController;
  let service: CategoryService;

  beforeEach(async () => {
    // Mock CategoryService
    const mockCategoryService = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [
        {
          provide: CategoryService,
          useValue: mockCategoryService,
        },
      ],
    }).compile();

    controller = module.get<CategoryController>(CategoryController);
    service = module.get<CategoryService>(CategoryService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createCategoryDto: CreateCategoryDto = {
      name: 'test-category',
      label: 'Test Category',
    };

    it('should create a category', async () => {
      // Given
      const expectedResult = new Category();
      expectedResult.name = createCategoryDto.name;
      expectedResult.label = createCategoryDto.label;

      jest.spyOn(service, 'create').mockResolvedValue(expectedResult);

      // When
      const result = await controller.create(createCategoryDto);

      // Then
      expect(result).toBe(expectedResult);
      expect(service.create).toHaveBeenCalledWith(createCategoryDto);
      expect(service.create).toHaveBeenCalledTimes(1);
    });

    it('should handle duplicate name error', async () => {
      // Given
      jest
        .spyOn(service, 'create')
        .mockRejectedValue(
          new ConflictException('같은 이름의 카테고리가 있습니다.'),
        );

      // When & Then
      await expect(controller.create(createCategoryDto)).rejects.toThrow(
        ConflictException,
      );
      expect(service.create).toHaveBeenCalledWith(createCategoryDto);
      expect(service.create).toHaveBeenCalledTimes(1);
    });
  });
});
