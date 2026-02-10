import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards, UseInterceptors } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AssignmentsService } from "../application/assignments.service";
import { PaginationQueryDto } from "../../../common/dto/pagination.dto";
import { CreateAssignmentDto } from "../dto/create-assignment.dto";
import { SubmitAssignmentDto } from "../dto/submit-assignment.dto";
import { UpdateAssignmentDto } from "../dto/update-assignment.dto";
import { GradeSubmissionDto } from "../dto/grade-submission.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import type { Request } from "express";
import { AuditInterceptor } from "../../../common/interceptors/audit.interceptor";

@ApiTags("assignments")
@ApiBearerAuth()
@Controller("assignments")
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Get()
  list(@Query() query: PaginationQueryDto) {
    return this.assignmentsService.list(query.offset, query.limit);
  }

  @Post()
  @Roles("lecturer", "admin")
  create(@Body() dto: CreateAssignmentDto, @Req() req: Request) {
    const user = req.user as { id: string; role: string };
    return this.assignmentsService.create(dto, user);
  }

  @Patch(":id")
  @Roles("lecturer", "admin")
  update(@Param("id") id: string, @Body() dto: UpdateAssignmentDto, @Req() req: Request) {
    const user = req.user as { id: string; role: string };
    return this.assignmentsService.update(id, dto, user);
  }

  @Post(":id/publish")
  @Roles("lecturer", "admin")
  publish(@Param("id") id: string, @Req() req: Request) {
    const user = req.user as { id: string; role: string };
    return this.assignmentsService.publish(id, user);
  }

  @Delete(":id")
  @Roles("lecturer", "admin")
  async remove(@Param("id") id: string, @Req() req: Request) {
    const user = req.user as { id: string; role: string };
    await this.assignmentsService.remove(id, user);
    return { deleted: true };
  }

  @Post(":id/submissions")
  @Roles("student")
  submit(@Param("id") id: string, @Body() dto: SubmitAssignmentDto, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.assignmentsService.submit(id, user.id, dto);
  }

  @Get(":id/submissions")
  @Roles("lecturer", "admin")
  listSubmissions(@Param("id") id: string, @Query() query: PaginationQueryDto, @Req() req: Request) {
    const user = req.user as { id: string; role: string };
    return this.assignmentsService.listSubmissions(id, query.offset, query.limit, user);
  }

  @Post(":id/submissions/:submissionId/grade")
  @Roles("lecturer", "admin")
  gradeSubmission(
    @Param("id") id: string,
    @Param("submissionId") submissionId: string,
    @Body() dto: GradeSubmissionDto,
    @Req() req: Request
  ) {
    const user = req.user as { id: string; role: string };
    return this.assignmentsService.gradeSubmission(id, submissionId, user, dto);
  }
}
