import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { UsersService } from "../application/users.service";
import { CreateUserDto } from "../dto/create-user.dto";
import { UpdateUserDto } from "../dto/update-user.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";

@ApiTags("users")
@ApiBearerAuth()
@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles("admin")
  async create(@Body() dto: CreateUserDto) {
    const user = await this.usersService.createUser(dto);
    return this.usersService.toSafeUser(user);
  }

  @Get(":id")
  @Roles("admin")
  async getById(@Param("id") id: string) {
    const user = await this.usersService.findById(id);
    return user ? this.usersService.toSafeUser(user) : null;
  }

  @Patch(":id")
  @Roles("admin")
  async update(@Param("id") id: string, @Body() dto: UpdateUserDto) {
    const user = await this.usersService.updateUser(id, dto);
    return this.usersService.toSafeUser(user);
  }
}
