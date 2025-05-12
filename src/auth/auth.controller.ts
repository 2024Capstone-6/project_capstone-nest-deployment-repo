import { Controller, Post, Body, Get, Query, Redirect } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Res } from '@nestjs/common';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService,
    private readonly httpService: HttpService
  ) {}

  @Post('login')
  async signIn(
    @Body('email') email: string,
    @Body('password') password: string,
  ): Promise<{ accessToken: string, refreshToken: string }> {
    const accessToken = await this.authService.signIn(email, password); // 로그인 로직 호출
    const refreshToken = await this.authService.generateRefreshToken(email, password); // 로그인시 리프레쉬 토큰 발급ㅇㅇ
    return { accessToken, refreshToken }; // 액세스 토큰 반환
  }

  @Post('signup')
  async signUp(@Body() createUserDto: CreateUserDto): Promise<void> {
    await this.authService.signUp(createUserDto); // 회원가입 로직 호출
  }

  @Post('refresh')
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshAccessToken(refreshToken);
  }

  @Get('google')
  @Redirect()
  googleAuth() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    const scope = ['email', 'profile'].join(' ');
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&access_type=offline`;
    return { url: authUrl };
  }

  // Step 2: Google에서 Authorization Code를 받는 콜백
  @Get('google/callback')
  async googleAuthCallback(@Query('code') code: string, @Res() res: Response) {
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    //Step 3: Authorization Code로 Access Token 요청
    const tokenResponse = await firstValueFrom(
      this.httpService.post(tokenUrl, {
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    );

    const { access_token } = tokenResponse.data;

    // Step 4: Access Token으로 사용자 정보 가져오기
    const userInfoUrl = 'https://www.googleapis.com/oauth2/v2/userinfo';
    const userResponse = await firstValueFrom(
      this.httpService.get(userInfoUrl, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
    );

    const userInfo = userResponse.data; // 이거에 구글에서 받은거 다 들어있음ㅇㅇ 

    const savedUser = await this.authService.saveGoogleUser(userInfo); // save머시기로 email, name, picture(프로필사진)만 뽑아내고 저장

    const accessToken = await this.authService.googleToken(savedUser);
    const refreshToken = await this.authService.googleRefreshToken(savedUser);

    res.cookie('accessToken', accessToken, {
      httpOnly: false,       // 자바스크립트로 접근 불가옵션 (XSS 방지) 차후 jwt guards 보안 처리후 true로 리팩토링 예정 false는 원래 보안상 추천되지 않음(프론트에서 쿠키에 접근가능해짐)
      secure: false,        // HTTPS에서만 동작하려면 true (개발환경은 false)
      sameSite: 'lax',      // CSRF 방지
      maxAge: 15 * 60 * 1000, // 15분 (밀리초 단위)
      path: '/',
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
      path: '/',
    });

    return res.redirect('http://yoajung.store:3000/');
  }
}