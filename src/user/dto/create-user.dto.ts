import { IsNotEmpty, IsEmail } from 'class-validator';
import { StartupSnapshot } from 'v8';

export class CreateUserDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;

  @IsNotEmpty()
  name: string;
}