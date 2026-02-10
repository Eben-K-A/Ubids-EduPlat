import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "../src/modules/auth/auth.module";
import { UsersModule } from "../src/modules/users/users.module";
import { HealthModule } from "../src/modules/health/health.module";
import { UserEntity } from "../src/modules/users/domain/user.entity";
import { RefreshTokenEntity } from "../src/modules/auth/domain/refresh-token.entity";

const testConfig = {
  jwt: {
    accessSecret: "test-access-secret-32-chars-minimum",
    refreshSecret: "test-refresh-secret-32-chars-minimum",
    accessTtl: 900,
    refreshTtl: 1209600
  }
};

describe("App E2E", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [() => testConfig] }),
        TypeOrmModule.forRoot({
          type: "sqlite",
          database: ":memory:",
          entities: [UserEntity, RefreshTokenEntity],
          synchronize: true
        }),
        JwtModule.register({}),
        AuthModule,
        UsersModule,
        HealthModule
      ]
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("health liveness", async () => {
    await request(app.getHttpServer())
      .get("/health/liveness")
      .expect(200);
  });

  it("register and login", async () => {
    await request(app.getHttpServer())
      .post("/auth/register")
      .send({
        email: "e2e@example.com",
        firstName: "E2E",
        lastName: "User",
        role: "student",
        password: "ChangeMe123!"
      })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "e2e@example.com", password: "ChangeMe123!" })
      .expect(201);

    expect(res.body.data.accessToken).toBeDefined();
  });
});
