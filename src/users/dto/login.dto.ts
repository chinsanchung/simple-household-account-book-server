import { ValidateIf } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class LoginDto extends CreateUserDto {
  @ValidateIf(() => false)
  override userName: string;

  @ValidateIf(() => false)
  override password: string;
}
