import { IsString, Length, Matches } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @Length(7, 15, {
    message: '아이디는 최소 7글자, 최대 15글자까지 입력하셔야 합니다.',
  })
  userId: string;

  @IsString()
  @Length(10, 20, {
    message: '비밀번호는 최소 10글자, 최대 20글자까지 입력하셔야 합니다.',
  })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        '비밀번호는 최소한 대문자 하나, 소문자 하나, 그리고 특수 문자 하나를 포함해서 작성하셔야 합니다.(@$!%?&)',
    },
  )
  password: string;
}
