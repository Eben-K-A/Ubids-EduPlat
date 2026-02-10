import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AssignmentEntity } from "../domain/assignment.entity";
import { SubmissionEntity } from "../domain/submission.entity";
import { CreateAssignmentDto } from "../dto/create-assignment.dto";
import { SubmitAssignmentDto } from "../dto/submit-assignment.dto";
import { UpdateAssignmentDto } from "../dto/update-assignment.dto";
import { GradeSubmissionDto } from "../dto/grade-submission.dto";
import { PaginatedResult } from "../../../common/dto/pagination.dto";
import { CourseEntity } from "../../courses/domain/course.entity";
import { CourseGradePolicyEntity } from "../../courses/domain/course-grade-policy.entity";

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectRepository(AssignmentEntity)
    private readonly assignmentsRepo: Repository<AssignmentEntity>,
    @InjectRepository(SubmissionEntity)
    private readonly submissionsRepo: Repository<SubmissionEntity>,
    @InjectRepository(CourseEntity)
    private readonly coursesRepo: Repository<CourseEntity>,
    @InjectRepository(CourseGradePolicyEntity)
    private readonly gradePolicyRepo: Repository<CourseGradePolicyEntity>
  ) {}

  async list(offset = 0, limit = 20): Promise<PaginatedResult<AssignmentEntity>> {
    const [items, total] = await this.assignmentsRepo.findAndCount({
      skip: offset,
      take: limit,
      order: { createdAt: "DESC" }
    });
    return { items, total, offset, limit };
  }

  async create(dto: CreateAssignmentDto, actor: { id: string; role: string }) {
    const course = await this.coursesRepo.findOne({ where: { id: dto.courseId } });
    if (!course) throw new NotFoundException("Course not found");
    if (actor.role !== "admin" && course.lecturerId !== actor.id) {
      throw new NotFoundException("Course not found");
    }
    const assignment = this.assignmentsRepo.create({
      courseId: dto.courseId,
      title: dto.title,
      description: dto.description,
      dueDate: new Date(dto.dueDate),
      points: dto.points,
      status: "draft"
    });
    return this.assignmentsRepo.save(assignment);
  }

  async update(id: string, dto: UpdateAssignmentDto, actor: { id: string; role: string }) {
    const assignment = await this.assignmentsRepo.findOne({ where: { id } });
    if (!assignment) throw new NotFoundException("Assignment not found");
    const course = await this.coursesRepo.findOne({ where: { id: assignment.courseId } });
    if (!course) throw new NotFoundException("Course not found");
    if (actor.role !== "admin" && course.lecturerId !== actor.id) {
      throw new NotFoundException("Assignment not found");
    }

    if (dto.dueDate) {
      assignment.dueDate = new Date(dto.dueDate);
    }
    if (dto.title) assignment.title = dto.title;
    if (dto.description) assignment.description = dto.description;
    if (dto.points) assignment.points = dto.points;
    return this.assignmentsRepo.save(assignment);
  }

  async publish(id: string, actor: { id: string; role: string }) {
    const assignment = await this.assignmentsRepo.findOne({ where: { id } });
    if (!assignment) throw new NotFoundException("Assignment not found");
    const course = await this.coursesRepo.findOne({ where: { id: assignment.courseId } });
    if (!course) throw new NotFoundException("Course not found");
    if (actor.role !== "admin" && course.lecturerId !== actor.id) {
      throw new NotFoundException("Assignment not found");
    }
    assignment.status = "published";
    return this.assignmentsRepo.save(assignment);
  }

  async remove(id: string, actor: { id: string; role: string }) {
    const assignment = await this.assignmentsRepo.findOne({ where: { id } });
    if (!assignment) throw new NotFoundException("Assignment not found");
    const course = await this.coursesRepo.findOne({ where: { id: assignment.courseId } });
    if (!course) throw new NotFoundException("Course not found");
    if (actor.role !== "admin" && course.lecturerId !== actor.id) {
      throw new NotFoundException("Assignment not found");
    }
    await this.assignmentsRepo.delete({ id });
  }

  async submit(assignmentId: string, studentId: string, dto: SubmitAssignmentDto) {
    const assignment = await this.assignmentsRepo.findOne({ where: { id: assignmentId } });
    if (!assignment) throw new NotFoundException("Assignment not found");

    const policy = await this.gradePolicyRepo.findOne({ where: { courseId: assignment.courseId } });
    const attempts = await this.submissionsRepo.count({ where: { assignmentId, studentId } });
    if (policy) {
      if (!policy.allowResubmission && attempts > 0) return await this.latestSubmission(assignmentId, studentId);
      if (attempts >= policy.maxAttempts) return await this.latestSubmission(assignmentId, studentId);
    } else if (attempts > 0) {
      return await this.latestSubmission(assignmentId, studentId);
    }

    const submission = this.submissionsRepo.create({
      assignmentId,
      studentId,
      content: dto.content,
      fileUrl: dto.fileUrl,
      attemptNumber: attempts + 1,
      status: "submitted",
      submittedAt: new Date()
    });
    return this.submissionsRepo.save(submission);
  }

  async listSubmissions(assignmentId: string, offset = 0, limit = 20, actor?: { id: string; role: string }) {
    const assignment = await this.assignmentsRepo.findOne({ where: { id: assignmentId } });
    if (!assignment) throw new NotFoundException("Assignment not found");
    if (actor) {
      const course = await this.coursesRepo.findOne({ where: { id: assignment.courseId } });
      if (!course) throw new NotFoundException("Course not found");
      if (actor.role !== "admin" && course.lecturerId !== actor.id) {
        throw new NotFoundException("Assignment not found");
      }
    }
    const [items, total] = await this.submissionsRepo.findAndCount({
      where: { assignmentId },
      skip: offset,
      take: limit,
      order: { createdAt: "DESC" }
    });
    return { items, total, offset, limit };
  }

  private async latestSubmission(assignmentId: string, studentId: string) {
    return this.submissionsRepo.findOne({
      where: { assignmentId, studentId },
      order: { createdAt: "DESC" }
    });
  }

  async gradeSubmission(assignmentId: string, submissionId: string, actor: { id: string; role: string }, dto: GradeSubmissionDto) {
    const assignment = await this.assignmentsRepo.findOne({ where: { id: assignmentId } });
    if (!assignment) throw new NotFoundException("Assignment not found");
    const course = await this.coursesRepo.findOne({ where: { id: assignment.courseId } });
    if (!course) throw new NotFoundException("Course not found");
    if (actor.role !== "admin" && course.lecturerId !== actor.id) {
      throw new NotFoundException("Assignment not found");
    }
    const submission = await this.submissionsRepo.findOne({ where: { id: submissionId, assignmentId } });
    if (!submission) throw new NotFoundException("Submission not found");
    const policy = await this.gradePolicyRepo.findOne({ where: { courseId: assignment.courseId } });
    const raw = dto.grade;
    let finalGrade = raw;
    if (policy && submission.submittedAt && assignment.dueDate && submission.submittedAt > assignment.dueDate) {
      const penalty = Math.max(0, Math.min(100, policy.latePenaltyPercent));
      finalGrade = Math.max(0, Math.round(raw - (raw * penalty) / 100));
    }
    submission.rawGrade = raw;
    submission.grade = finalGrade;
    submission.feedback = dto.feedback ?? submission.feedback ?? null;
    submission.status = "graded";
    submission.gradedAt = new Date();
    return this.submissionsRepo.save(submission);
  }
}
