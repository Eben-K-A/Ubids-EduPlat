import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AssignmentEntity } from "./domain/assignment.entity";
import { SubmissionEntity } from "./domain/submission.entity";
import { CourseEntity } from "../courses/domain/course.entity";
import { AssignmentsService } from "./application/assignments.service";
import { AssignmentsController } from "./presentation/assignments.controller";
import { AuditModule } from "../audit/audit.module";
import { AuditInterceptor } from "../../common/interceptors/audit.interceptor";

@Module({
  imports: [TypeOrmModule.forFeature([AssignmentEntity, SubmissionEntity, CourseEntity]), AuditModule],
  providers: [AssignmentsService, AuditInterceptor],
  controllers: [AssignmentsController]
})
export class AssignmentsModule {}
