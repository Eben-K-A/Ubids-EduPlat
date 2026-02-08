import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserEntity } from "../domain/user.entity";
import { CreateUserDto } from "../dto/create-user.dto";
import { UpdateUserDto } from "../dto/update-user.dto";
import { hashPassword } from "../../../common/utils/password";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>
  ) {}

  async findByEmail(email: string) {
    return this.usersRepo.findOne({ where: { email } });
  }

  async findById(id: string) {
    return this.usersRepo.findOne({ where: { id } });
  }

  async createUser(data: CreateUserDto) {
    const passwordHash = await hashPassword(data.password);
    const user = this.usersRepo.create({
      email: data.email.toLowerCase(),
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      passwordHash
    });
    return this.usersRepo.save(user);
  }

  async updateUser(id: string, updates: UpdateUserDto) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException("User not found");
    Object.assign(user, updates);
    return this.usersRepo.save(user);
  }

  async deactivateUser(id: string) {
    return this.updateUser(id, { isActive: false });
  }

  toSafeUser(user: UserEntity) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }
}
