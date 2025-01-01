import { IsString, Length } from 'class-validator';

export class CreatePaymentMethodDto {
  @IsString()
  @Length(1, 30, {
    message: '결제 수단은 최대 30글자까지 입력할 수 있습니다.',
  })
  name: string;

  @IsString()
  label: string;
}
