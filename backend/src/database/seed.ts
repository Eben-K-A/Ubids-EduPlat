import "reflect-metadata";
import "dotenv/config";
import { DataSource } from "typeorm";
import { dataSourceOptions } from "./typeorm.config";
import { UserEntity } from "../modules/users/domain/user.entity";
import { UserRole } from "../modules/users/domain/user-role.enum";
import { hashPassword } from "../common/utils/password";

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required");

  const dataSource = new DataSource({
    ...dataSourceOptions(databaseUrl),
    entities: [UserEntity]
  });

  await dataSource.initialize();
  const repo = dataSource.getRepository(UserEntity);

  const users = [
    { email: "admin@ubids.edu", role: UserRole.ADMIN, firstName: "System", lastName: "Admin" },
    { email: "lecturer@ubids.edu", role: UserRole.LECTURER, firstName: "Default", lastName: "Lecturer" },
    { email: "student@ubids.edu", role: UserRole.STUDENT, firstName: "Default", lastName: "Student" }
  ];

  for (const user of users) {
    const existing = await repo.findOne({ where: { email: user.email } });
    if (existing) continue;

    const passwordHash = await hashPassword("ChangeMe123!");
    const entity = repo.create({
      ...user,
      passwordHash,
      isActive: true
    });
    await repo.save(entity);
  }

  await dataSource.destroy();
}

seed().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
