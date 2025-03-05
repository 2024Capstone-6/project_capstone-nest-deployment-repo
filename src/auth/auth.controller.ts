import { Controller, Post, Body, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../user/dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async signIn(
    @Body('email') email: string,
    @Body('password') password: string,
  ): Promise<{ accessToken: string }> {
    const accessToken = await this.authService.signIn(email, password); // 로그인 로직 호출
    return { accessToken }; // 액세스 토큰 반환
  }

  @Post('signup')
  async signUp(@Body() createUserDto: CreateUserDto): Promise<void> {
    await this.authService.signUp(createUserDto); // 회원가입 로직 호출
  }
}