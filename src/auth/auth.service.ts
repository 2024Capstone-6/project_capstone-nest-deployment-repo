import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../user/entity/user.entity';
import { CreateUserDto } from '../../src/user/dto/create-user.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  // 리프레시 토큰 발급
  async generateRefreshToken(email: string, password: string): Promise<string> {
    const user = await this.userRepository.findOneBy({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new BadRequestException('Invalid credentials');
    }
    const payload = { email: user.email, sub: user.uuid, name: user.name };
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
    });
  }

  // 구글 엑세스 토큰 발급
  async googleToken(user: User): Promise<string> {
    const payload = { email: user.email, sub: user.uuid, name: user.name };
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
  }

  // 구글 리프레시 토큰 발급
  async googleRefreshToken(user: User): Promise<string> {
    const payload = { email: user.email, sub: user.uuid, name: user.name };
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
    });
  }

  // 리프레시 토큰으로 액세스 토큰 재발급
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const decoded = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      // 여기서도 decoded.sub로 uuid 찾기
      const user = await this.userRepository.findOneBy({ uuid: decoded.sub });
      if (!user) throw new BadRequestException('User not found');

      const payload = { email: user.email, sub: user.uuid, name: user.name };
      const accessToken = this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN,
      });

      return { accessToken };
    } catch (error) {
      throw new BadRequestException('Invalid or expired refresh token');
    }
  }

  async signUp(createUserDto: CreateUserDto): Promise<void> {
    const { email, password, name } = createUserDto;

    const existingUser = await this.userRepository.findOneBy({ email });
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      name,
    });
    await this.userRepository.save(user);
  }

  async signIn(email: string, password: string): Promise<string> {
    const user = await this.userRepository.findOneBy({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new BadRequestException('Invalid credentials');
    }

    const payload = { email: user.email, sub: user.uuid, name: user.name };
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
  }

  async saveGoogleUser(userInfo: any): Promise<User> {
    const { email, name, picture } = userInfo;

    let user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      user = this.userRepository.create({
        email,
        name,
        profile_image: picture,
      });
    } else {
      user.email = email;
      user.name = name;
      user.profile_image = picture;
    }

    return await this.userRepository.save(user);
  }
}
