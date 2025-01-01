import { Test, TestingModule } from '@nestjs/testing';
import { AccountBookService } from './account-book.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountBook } from './account-book.entity';
import { CustomLoggerService } from '../logger/logger.service';
import { CreateAccountBookDto } from './dto/create-account-book.dto';
import { validate } from 'class-validator';

describe('AccountBookService', () => {
  let service: AccountBookService;
  let repository: Repository<AccountBook>;
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
        AccountBookService,
        {
          provide: getRepositoryToken(AccountBook),
          useValue: {
            save: jest.fn(),
          },
        },
        {
          provide: CustomLoggerService,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<AccountBookService>(AccountBookService);
    repository = module.get<Repository<AccountBook>>(
      getRepositoryToken(AccountBook),
    );
    logger = module.get<CustomLoggerService>(CustomLoggerService);
  });

  describe('create', () => {
    const mockUser = {
      id: 1,
      userName: 'testuser',
    };

    const mockCreateDto: CreateAccountBookDto = {
      title: 'Test Account Book',
      paymentAmount: 10000,
      paymentType: 'expense',
      categoryId: 1,
      paymentMethodId: 1,
      userId: 1,
    };

    it('should create an account book entry successfully', async () => {
      // Given
      const expectedAccountBook = new AccountBook();
      Object.assign(expectedAccountBook, {
        ...mockCreateDto,
        userId: mockUser.id,
      });

      jest.spyOn(repository, 'save').mockResolvedValue(expectedAccountBook);

      // When
      const result = await service.create({
        createDto: mockCreateDto,
        user: mockUser,
      });

      // Then
      expect(result).toEqual(expectedAccountBook);
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          title: mockCreateDto.title,
          paymentAmount: mockCreateDto.paymentAmount,
          paymentType: mockCreateDto.paymentType,
          categoryId: mockCreateDto.categoryId,
          paymentMethodId: mockCreateDto.paymentMethodId,
          userId: mockUser.id,
        }),
      );
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should handle errors during creation', async () => {
      // Given
      jest
        .spyOn(repository, 'save')
        .mockRejectedValue(new Error('Database error'));

      // When & Then
      await expect(
        service.create({
          createDto: mockCreateDto,
          user: mockUser,
        }),
      ).rejects.toThrow('에러가 발생했습니다.');

      expect(logger.error).toHaveBeenCalledWith(
        'account-book CREATE',
        expect.any(String),
      );
    });

    it('should validate payment type is either income or expense', async () => {
      // Given
      const dto = new CreateAccountBookDto();
      Object.assign(dto, {
        ...mockCreateDto,
        paymentType: 'invalid-type',
      });

      // When & Then
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should validate title length is between 10 and 100 characters', async () => {
      // Given
      const dto = new CreateAccountBookDto();
      Object.assign(dto, {
        ...mockCreateDto,
        title: 'short', // less than 10 characters
      });

      // When & Then
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should require payment amount to be a decimal number', async () => {
      // Given
      const dto = new CreateAccountBookDto();
      Object.assign(dto, {
        ...mockCreateDto,
        paymentAmount: 'not-a-number',
      });

      // When & Then
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});