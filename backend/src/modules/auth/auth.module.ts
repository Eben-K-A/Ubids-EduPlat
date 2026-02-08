import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthService } from "./application/auth.service";
import { AuthController } from "./presentation/auth.controller";
import { RefreshTokenEntity } from "./domain/refresh-token.entity";
import { UsersModule } from "../users/users.module";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { UserEntity } from "../users/domain/user.entity";

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({}),
    TypeOrmModule.forFeature([RefreshTokenEntity, UserEntity])
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController]
})
export class AuthModule {}
