import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt'; // Passport와 JWT 관련 클래스 import

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Authorization 헤더에서 토큰 추출
      ignoreExpiration: false, // 만료된 토큰 거부
      secretOrKey: process.env.JWT_SECRET || 'default_secret', // 시크릿 키 설정
    });
  }

  async validate(payload: any) {
    // JWT payload 검증 후 사용자 정보를 반환
    return { uuid: payload.sub, email: payload.email };
  }
}