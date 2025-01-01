import { Test, TestingModule } from '@nestjs/testing';
import { PaymentMethodController } from './payment-method.controller';
import { PaymentMethodService } from './payment-method.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { PaymentMethod } from './payment-method.entity';
import { ConflictException } from '@nestjs/common';

describe('PaymentMethodController', () => {
  let controller: PaymentMethodController;
  let service: PaymentMethodService;

  beforeEach(async () => {
    // Mock PaymentMethodService
    const mockPaymentMethodService = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentMethodController],
      providers: [
        {
          provide: PaymentMethodService,
          useValue: mockPaymentMethodService,
        },
      ],
    }).compile();

    controller = module.get<PaymentMethodController>(PaymentMethodController);
    service = module.get<PaymentMethodService>(PaymentMethodService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createPaymentMethodDto: CreatePaymentMethodDto = {
      name: 'test-payment',
      label: 'Test Payment',
    };

    it('should create a payment method', async () => {
      // Given
      const expectedResult = new PaymentMethod();
      expectedResult.name = createPaymentMethodDto.name;
      expectedResult.label = createPaymentMethodDto.label;

      jest.spyOn(service, 'create').mockResolvedValue(expectedResult);

      // When
      const result = await controller.create(createPaymentMethodDto);

      // Then
      expect(result).toBe(expectedResult);
      expect(service.create).toHaveBeenCalledWith(createPaymentMethodDto);
      expect(service.create).toHaveBeenCalledTimes(1);
    });

    it('should handle duplicate name error', async () => {
      // Given
      jest
        .spyOn(service, 'create')
        .mockRejectedValue(
          new ConflictException('같은 이름의 결제 방법이 있습니다.'),
        );

      // When & Then
      await expect(controller.create(createPaymentMethodDto)).rejects.toThrow(
        ConflictException,
      );
      expect(service.create).toHaveBeenCalledWith(createPaymentMethodDto);
      expect(service.create).toHaveBeenCalledTimes(1);
    });
  });
});
