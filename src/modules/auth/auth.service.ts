import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<{
    accessToken: string;
    tokenType: 'Bearer';
  }> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      nickname: user.nickname,
      email: user.email,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
    };
  }

  private async validateUser(email: string, password: unknown): Promise<User> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(
      this.normalizePassword(password),
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  private normalizePassword(password: unknown): string {
    return String(password);
  }
}
