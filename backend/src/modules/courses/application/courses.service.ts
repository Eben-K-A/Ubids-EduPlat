import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CourseEntity } from "../domain/course.entity";
import { EnrollmentEntity } from "../domain/enrollment.entity";
import { CourseGradePolicyEntity } from "../domain/course-grade-policy.entity";
import { CreateCourseDto } from "../dto/create-course.dto";
import { UpdateCourseDto } from "../dto/update-course.dto";
import { PaginatedResult } from "../../../common/dto/pagination.dto";

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(CourseEntity)
    private readonly coursesRepo: Repository<CourseEntity>,
    @InjectRepository(EnrollmentEntity)
    private readonly enrollmentsRepo: Repository<EnrollmentEntity>,
    @InjectRepository(CourseGradePolicyEntity)
    private readonly gradePolicyRepo: Repository<CourseGradePolicyEntity>
  ) {}

  async list(offset = 0, limit = 20): Promise<PaginatedResult<CourseEntity>> {
    const [items, total] = await this.coursesRepo.findAndCount({
      skip: offset,
      take: limit,
      order: { createdAt: "DESC" }
    });
    return { items, total, offset, limit };
  }

  async createCourse(dto: CreateCourseDto, lecturer: { id: string; name: string }) {
    const course = this.coursesRepo.create({
      ...dto,
      lecturerId: lecturer.id,
      lecturerName: lecturer.name,
      status: "draft",
      enrolledCount: 0
    });
    return this.coursesRepo.save(course);
  }

  async getById(id: string) {
    return this.coursesRepo.findOne({ where: { id } });
  }

  async updateCourse(id: string, dto: UpdateCourseDto, actor: { id: string; role: string }) {
    const course = await this.getById(id);
    if (!course) throw new NotFoundException("Course not found");
    if (actor.role !== "admin" && course.lecturerId !== actor.id) throw new ForbiddenException();
    Object.assign(course, dto);
    return this.coursesRepo.save(course);
  }

  async deleteCourse(id: string, actor: { id: string; role: string }) {
    const course = await this.getById(id);
    if (!course) throw new NotFoundException("Course not found");
    if (actor.role !== "admin" && course.lecturerId !== actor.id) throw new ForbiddenException();
    await this.coursesRepo.delete({ id });
  }

  async publishCourse(id: string, lecturerId: string, role: string) {
    const course = await this.coursesRepo.findOne({ where: { id } });
    if (!course) throw new NotFoundException("Course not found");
    if (role !== "admin" && course.lecturerId !== lecturerId) throw new ForbiddenException();
    course.status = "published";
    return this.coursesRepo.save(course);
  }

  async enroll(courseId: string, student: { id: string; name: string }) {
    const course = await this.coursesRepo.findOne({ where: { id: courseId, status: "published" } });
    if (!course) throw new NotFoundException("Course not found");

    const existing = await this.enrollmentsRepo.findOne({
      where: { courseId, studentId: student.id }
    });
    if (existing) return existing;

    const enrollment = this.enrollmentsRepo.create({
      courseId,
      studentId: student.id,
      studentName: student.name,
      status: "active"
    });

    await this.enrollmentsRepo.save(enrollment);
    course.enrolledCount += 1;
    await this.coursesRepo.save(course);

    return enrollment;
  }

  async listEnrollments(courseId: string, actor: { id: string; role: string }, offset = 0, limit = 20) {
    const course = await this.coursesRepo.findOne({ where: { id: courseId } });
    if (!course) throw new NotFoundException("Course not found");
    if (actor.role !== "admin" && course.lecturerId !== actor.id) throw new ForbiddenException();
    const [items, total] = await this.enrollmentsRepo.findAndCount({
      where: { courseId },
      skip: offset,
      take: limit,
      order: { enrolledAt: "DESC" }
    });
    return { items, total, offset, limit };
  }

  async getGradePolicy(courseId: string) {
    return this.gradePolicyRepo.findOne({ where: { courseId } });
  }

  async upsertGradePolicy(courseId: string, actor: { id: string; role: string }, policy: { latePenaltyPercent: number; allowResubmission: boolean; maxAttempts: number }) {
    const course = await this.coursesRepo.findOne({ where: { id: courseId } });
    if (!course) throw new NotFoundException("Course not found");
    if (actor.role !== "admin" && course.lecturerId !== actor.id) throw new ForbiddenException();

    const existing = await this.gradePolicyRepo.findOne({ where: { courseId } });
    if (existing) {
      existing.latePenaltyPercent = policy.latePenaltyPercent;
      existing.allowResubmission = policy.allowResubmission;
      existing.maxAttempts = policy.maxAttempts;
      return this.gradePolicyRepo.save(existing);
    }

    const created = this.gradePolicyRepo.create({ courseId, ...policy });
    return this.gradePolicyRepo.save(created);
  }
}
