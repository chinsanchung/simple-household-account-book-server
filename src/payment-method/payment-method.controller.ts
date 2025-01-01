import { Controller, Post, Body } from '@nestjs/common';
import { PaymentMethodService } from './payment-method.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { PaymentMethod } from './payment-method.entity';

@Controller('payment-method')
export class PaymentMethodController {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  @Post()
  create(@Body() createDto: CreatePaymentMethodDto): Promise<PaymentMethod> {
    return this.paymentMethodService.create(createDto);
  }
}
