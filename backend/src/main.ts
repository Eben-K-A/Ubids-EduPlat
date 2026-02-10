import "reflect-metadata";
import "./observability/otel";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { RequestIdMiddleware } from "./common/middleware/request-id.middleware";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { AppLogger } from "./common/logger";
import { metricsMiddleware } from "./common/middleware/metrics.middleware";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new AppLogger()
  });

  app.enableShutdownHooks();
  app.use(helmet());
  app.use(new RequestIdMiddleware().use);
  app.use(metricsMiddleware);
  app.enableCors({ origin: true, credentials: true });

  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle("UBIDS EduPlat API")
    .setDescription("Backend API for UBIDS EduPlat")
    .setVersion("v1")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const port = process.env.PORT ? Number(process.env.PORT) : 4000;
  await app.listen(port);
}

bootstrap();
