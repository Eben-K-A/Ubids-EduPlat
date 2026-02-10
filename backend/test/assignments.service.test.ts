import { AssignmentsService } from "../src/modules/assignments/application/assignments.service";
import { Repository } from "typeorm";
import { AssignmentEntity } from "../src/modules/assignments/domain/assignment.entity";
import { SubmissionEntity } from "../src/modules/assignments/domain/submission.entity";
import { CourseEntity } from "../src/modules/courses/domain/course.entity";
import { CourseGradePolicyEntity } from "../src/modules/courses/domain/course-grade-policy.entity";

function repo<T>() {
  return {
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn((x) => x),
    save: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  } as unknown as Repository<T>;
}

describe("AssignmentsService", () => {
  it("creates assignment for lecturer", async () => {
    const assignmentRepo = repo<AssignmentEntity>();
    const submissionRepo = repo<SubmissionEntity>();
    const coursesRepo = repo<CourseEntity>();
    const policyRepo = repo<CourseGradePolicyEntity>();

    coursesRepo.findOne = jest.fn().mockResolvedValue({ id: "c1", lecturerId: "l1" });
    assignmentRepo.save = jest.fn().mockResolvedValue({ id: "a1" });

    const service = new AssignmentsService(assignmentRepo, submissionRepo, coursesRepo, policyRepo);
    const result = await service.create({
      courseId: "c1",
      title: "HW1",
      description: "Test",
      dueDate: new Date().toISOString(),
      points: 100
    }, { id: "l1", role: "lecturer" });
    expect(result).toBeDefined();
  });
});
