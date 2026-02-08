import { Body, Controller, Get, Param, Post, Req, Res, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { ApiBearerAuth, ApiConsumes, ApiTags } from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { Response } from "express";
import { FilesService } from "../application/files.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { PresignUploadDto } from "../dto/presign-upload.dto";

@ApiTags("files")
@ApiBearerAuth()
@Controller("files")
@UseGuards(JwtAuthGuard, RolesGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post("upload")
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("file"))
  async upload(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    const user = req.user as { id: string };
    return this.filesService.upload(user.id, file);
  }

  @Post("presign")
  async presign(@Body() body: PresignUploadDto, @Req() req: any) {
    const user = req.user as { id: string };
    return this.filesService.getSignedUploadUrl(user.id, body.filename, body.mimeType, body.size);
  }

  @Get(":id/signed")
  async signed(@Param("id") id: string) {
    return this.filesService.getSignedDownloadUrl(id);
  }

  @Get(":id")
  async download(@Param("id") id: string, @Res() res: Response) {
    const result = await this.filesService.download(id);
    if (!result) {
      return res.status(404).end();
    }
    res.setHeader("Content-Type", result.file.mimeType);
    res.setHeader("Content-Disposition", `attachment; filename=\"${result.file.filename}\"`);
    return result.stream.pipe(res);
  }
}
