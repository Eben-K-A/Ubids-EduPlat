import { SetMetadata } from "@nestjs/common";

export const ROLES_KEY = "roles";
export type Role = "student" | "lecturer" | "admin" | "staff";

export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
