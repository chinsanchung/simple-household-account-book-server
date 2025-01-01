import { Test, TestingModule } from '@nestjs/testing';
import { PaymentMethodService } from './payment-method.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaymentMethod } from './payment-method.entity';
import { CustomLoggerService } from '../logger/logger.service';
import { ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { validate } from 'class-validator';

describe('PaymentMethodService', () => {
  let service: PaymentMethodService;
  let repository: Repository<PaymentMethod>;
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
        PaymentMethodService,
        {
          provide: getRepositoryToken(PaymentMethod),
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

    service = module.get<PaymentMethodService>(PaymentMethodService);
    repository = module.get<Repository<PaymentMethod>>(
      getRepositoryToken(PaymentMethod),
    );
    logger = module.get<CustomLoggerService>(CustomLoggerService);
  });

  describe('create', () => {
    const createPaymentMethodDto = {
      name: 'test-payment',
      label: 'Test Payment',
    };

    it('should successfully create a payment method', async () => {
      // Given
      const expectedResult = new PaymentMethod();
      expectedResult.name = createPaymentMethodDto.name;
      expectedResult.label = createPaymentMethodDto.label;

      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      jest.spyOn(repository, 'save').mockResolvedValue(expectedResult);

      // When
      const result = await service.create(createPaymentMethodDto);

      // Then
      expect(result).toEqual(expectedResult);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { name: createPaymentMethodDto.name },
      });
      expect(repository.save).toHaveBeenCalled();
      // Logger should not have been called for successful creation
      expect(logger.warn).not.toHaveBeenCalled();
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if payment method with same name exists', async () => {
      // Given
      const existingPaymentMethod = new PaymentMethod();
      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(existingPaymentMethod);

      // When & Then
      await expect(service.create(createPaymentMethodDto)).rejects.toThrow(
        ConflictException,
      );
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { name: createPaymentMethodDto.name },
      });
      // Verify warning was logged
      expect(logger.warn).toHaveBeenCalledWith(
        `paymentMethod CREATE - Attempted to create duplicate name: ${createPaymentMethodDto.name}`,
      );
    });

    it('should validate that name and label are strings', async () => {
      // Given
      const dto = new CreatePaymentMethodDto();
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
      await expect(service.create(createPaymentMethodDto)).rejects.toThrow(
        '결제 방법 생성에 오류가 발생했습니다.',
      );
      // Verify error was logged
      expect(logger.error).toHaveBeenCalledWith(
        'paymentMethod CREATE',
        expect.any(String),
      );
    });

    it('should validate name length is not more than 30 characters', async () => {
      // Given
      const dto = new CreatePaymentMethodDto();
      Object.assign(dto, {
        name: 'a'.repeat(31),
        label: 'Test Payment',
      });

      // When & Then
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should not allow empty name or label', async () => {
      // Given
      const dto = new CreatePaymentMethodDto();
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
