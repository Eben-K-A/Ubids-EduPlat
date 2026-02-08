import { Injectable, UnauthorizedException, ConflictException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThan } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { UsersService } from "../../users/application/users.service";
import { LoginDto } from "../dto/login.dto";
import { RegisterDto } from "../dto/register.dto";
import { verifyPassword, hashPassword } from "../../../common/utils/password";
import { hashToken } from "../../../common/utils/token";
import { RefreshTokenEntity } from "../domain/refresh-token.entity";
import { UserEntity } from "../../users/domain/user.entity";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshRepo: Repository<RefreshTokenEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email.toLowerCase());
    if (!user || !user.isActive) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const ok = await verifyPassword(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException("Invalid credentials");

    return this.issueTokens(user);
  }

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email.toLowerCase());
    if (existing) throw new ConflictException("Email already registered");
    const passwordHash = await hashPassword(dto.password);

    const user = this.usersRepo.create({
      email: dto.email.toLowerCase(),
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role,
      passwordHash,
      isActive: true
    });
    const saved = await this.usersRepo.save(user);

    return this.issueTokens(saved);
  }

  async refresh(refreshToken: string) {
    try {
      await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>("jwt.refreshSecret")
      });
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
    const now = new Date();
    const tokenHash = hashToken(refreshToken);

    const stored = await this.refreshRepo.findOne({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: MoreThan(now)
      }
    });

    if (!stored) throw new UnauthorizedException("Invalid refresh token");
    const user = await this.usersService.findById(stored.userId);
    if (!user) throw new UnauthorizedException("Invalid refresh token");

    stored.revokedAt = new Date();
    await this.refreshRepo.save(stored);

    return this.issueTokens(user);
  }

  async logout(refreshToken: string) {
    const tokenHash = hashToken(refreshToken);
    const stored = await this.refreshRepo.findOne({ where: { tokenHash } });
    if (stored) {
      stored.revokedAt = new Date();
      await this.refreshRepo.save(stored);
    }
  }

  private async issueTokens(user: UserEntity) {
    const accessTtl = this.configService.get<number>("jwt.accessTtl") || 900;
    const refreshTtl = this.configService.get<number>("jwt.refreshTtl") || 1209600;

    const accessToken = await this.jwtService.signAsync(
      { sub: user.id, role: user.role, email: user.email },
      {
        secret: this.configService.get<string>("jwt.accessSecret"),
        expiresIn: accessTtl
      }
    );

    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id },
      {
        secret: this.configService.get<string>("jwt.refreshSecret"),
        expiresIn: refreshTtl
      }
    );

    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + refreshTtl * 1000);

    const refreshEntity = this.refreshRepo.create({
      userId: user.id,
      tokenHash,
      expiresAt
    });
    await this.refreshRepo.save(refreshEntity);

    return {
      accessToken,
      refreshToken,
      tokenType: "Bearer",
      expiresIn: accessTtl,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    };
  }
}
