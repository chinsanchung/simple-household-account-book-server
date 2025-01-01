import { IsString, Length } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @Length(1, 50, {
    message: '카테고리는 최대 50글자까지 입력할 수 있습니다.',
  })
  name: string;

  @IsString()
  label: string;
}
