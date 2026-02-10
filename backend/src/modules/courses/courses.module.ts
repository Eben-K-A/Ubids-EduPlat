import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CourseEntity } from "./domain/course.entity";
import { EnrollmentEntity } from "./domain/enrollment.entity";
import { CourseGradePolicyEntity } from "./domain/course-grade-policy.entity";
import { CoursesService } from "./application/courses.service";
import { CoursesController } from "./presentation/courses.controller";
import { AuditModule } from "../audit/audit.module";
import { AuditInterceptor } from "../../common/interceptors/audit.interceptor";

@Module({
  imports: [TypeOrmModule.forFeature([CourseEntity, EnrollmentEntity, CourseGradePolicyEntity]), AuditModule],
  providers: [CoursesService, AuditInterceptor],
  controllers: [CoursesController]
})
export class CoursesModule {}
