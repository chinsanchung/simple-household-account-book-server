import { IsDecimal, IsEnum, IsString, Length } from 'class-validator';

export class CreateAccountBookDto {
  @IsString()
  @Length(10, 100, {
    message: '제목은 10 ~ 100자까지 입력할 수 있습니다.',
  })
  title: string;

  @IsDecimal()
  paymentAmount: number;

  @IsString()
  @IsEnum(['income', 'expense'])
  paymentType: string;

  categoryId: number;
  paymentMethodId: number;
  userId: number;
}
