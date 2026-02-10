import { AuthService } from "../src/modules/auth/application/auth.service";
import { UsersService } from "../src/modules/users/application/users.service";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { Repository } from "typeorm";
import { RefreshTokenEntity } from "../src/modules/auth/domain/refresh-token.entity";
import { UserEntity } from "../src/modules/users/domain/user.entity";

jest.mock("../src/common/utils/password", () => ({
  verifyPassword: jest.fn().mockResolvedValue(true),
  hashPassword: jest.fn().mockResolvedValue("hashed")
}));

const mockUser: UserEntity = {
  id: "user-1",
  email: "test@example.com",
  firstName: "Test",
  lastName: "User",
  passwordHash: "hashed",
  role: "student" as any,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

function createRepo<T>() {
  return {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn((x) => x),
    delete: jest.fn()
  } as unknown as Repository<T>;
}

describe("AuthService", () => {
  it("issues tokens on login", async () => {
    const usersService = {
      findByEmail: jest.fn().mockResolvedValue(mockUser)
    } as unknown as UsersService;

    const jwtService = {
      signAsync: jest.fn().mockResolvedValue("token")
    } as unknown as JwtService;

    const configService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === "jwt.accessTtl") return 900;
        if (key === "jwt.refreshTtl") return 1209600;
        if (key === "jwt.accessSecret") return "secret";
        if (key === "jwt.refreshSecret") return "secret";
        return undefined;
      })
    } as unknown as ConfigService;

    const refreshRepo = createRepo<RefreshTokenEntity>();
    const usersRepo = createRepo<UserEntity>();

    const service = new AuthService(usersService, jwtService, configService, refreshRepo, usersRepo);

    const result = await service.login({ email: "test@example.com", password: "password" });
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });
});
