import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards, UseInterceptors } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CoursesService } from "../application/courses.service";
import { PaginationQueryDto } from "../../../common/dto/pagination.dto";
import { CreateCourseDto } from "../dto/create-course.dto";
import { UpdateCourseDto } from "../dto/update-course.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import type { Request } from "express";
import { AuditInterceptor } from "../../../common/interceptors/audit.interceptor";

@ApiTags("courses")
@ApiBearerAuth()
@Controller("courses")
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  list(@Query() query: PaginationQueryDto) {
    return this.coursesService.list(query.offset, query.limit);
  }

  @Post()
  @Roles("lecturer", "admin")
  create(@Body() dto: CreateCourseDto, @Req() req: Request) {
    const user = req.user as { id: string; email?: string };
    return this.coursesService.createCourse(dto, {
      id: user.id,
      name: user.email || "Lecturer"
    });
  }

  @Get(":id")
  getById(@Param("id") id: string) {
    return this.coursesService.getById(id);
  }

  @Patch(":id")
  @Roles("lecturer", "admin")
  update(@Param("id") id: string, @Body() dto: UpdateCourseDto, @Req() req: Request) {
    const user = req.user as { id: string; role: string };
    return this.coursesService.updateCourse(id, dto, user);
  }

  @Delete(":id")
  @Roles("lecturer", "admin")
  async remove(@Param("id") id: string, @Req() req: Request) {
    const user = req.user as { id: string; role: string };
    await this.coursesService.deleteCourse(id, user);
    return { deleted: true };
  }

  @Post(":id/publish")
  @Roles("lecturer", "admin")
  publish(@Param("id") id: string, @Req() req: Request) {
    const user = req.user as { id: string; role: string };
    return this.coursesService.publishCourse(id, user.id, user.role);
  }

  @Post(":id/enroll")
  @Roles("student")
  enroll(@Param("id") id: string, @Req() req: Request) {
    const user = req.user as { id: string; email?: string };
    return this.coursesService.enroll(id, {
      id: user.id,
      name: user.email || "Student"
    });
  }

  @Get(":id/enrollments")
  @Roles("lecturer", "admin")
  enrollments(@Param("id") id: string, @Query() query: PaginationQueryDto) {
    return this.coursesService.listEnrollments(id, query.offset, query.limit);
  }
}
