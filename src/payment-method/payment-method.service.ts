import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentMethod } from './payment-method.entity';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { CustomLoggerService } from '../logger/logger.service';

@Injectable()
export class PaymentMethodService {
  constructor(
    @InjectRepository(PaymentMethod)
    private paymentMethodRepository: Repository<PaymentMethod>,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext(PaymentMethodService.name);
  }

  async create({
    name,
    label,
  }: CreatePaymentMethodDto): Promise<PaymentMethod> {
    try {
      const existingMethod = await this.paymentMethodRepository.findOne({
        where: { name },
      });
      if (existingMethod) {
        this.logger.warn(
          `paymentMethod CREATE - Attempted to create duplicate name: ${name}`,
        );
        throw new ConflictException('같은 이름의 결제 방법이 있습니다.');
      }

      const paymentMethod = new PaymentMethod();
      paymentMethod.name = name;
      paymentMethod.label = label;

      await this.paymentMethodRepository.save(paymentMethod);
      return paymentMethod;
    } catch (error) {
      this.logger.error('paymentMethod CREATE', error.stack);
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new Error('결제 방법 생성에 오류가 발생했습니다.');
    }
  }
}
