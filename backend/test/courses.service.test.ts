import { CoursesService } from "../src/modules/courses/application/courses.service";
import { Repository } from "typeorm";
import { CourseEntity } from "../src/modules/courses/domain/course.entity";
import { EnrollmentEntity } from "../src/modules/courses/domain/enrollment.entity";
import { CourseGradePolicyEntity } from "../src/modules/courses/domain/course-grade-policy.entity";

function repo<T>() {
  return {
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn((x) => x),
    save: jest.fn(),
    delete: jest.fn()
  } as unknown as Repository<T>;
}

describe("CoursesService", () => {
  it("creates course for lecturer", async () => {
    const coursesRepo = repo<CourseEntity>();
    const enrollmentsRepo = repo<EnrollmentEntity>();
    const policyRepo = repo<CourseGradePolicyEntity>();
    coursesRepo.save = jest.fn().mockResolvedValue({ id: "c1" });

    const service = new CoursesService(coursesRepo, enrollmentsRepo, policyRepo);
    const result = await service.createCourse({ code: "CS1", title: "Intro", description: "Test" }, { id: "l1", name: "Lecturer" });
    expect(result).toBeDefined();
  });
});
