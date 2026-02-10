import { Body, Controller, Get, Param, Post, Req, Res, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { ApiBearerAuth, ApiConsumes, ApiTags } from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { Response } from "express";
import { FilesService } from "../application/files.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { PresignUploadDto } from "../dto/presign-upload.dto";
import { MultipartCompleteDto, MultipartInitDto, MultipartPartDto } from "../dto/multipart.dto";
import { MultipartService } from "../application/multipart.service";

@ApiTags("files")
@ApiBearerAuth()
@Controller("files")
@UseGuards(JwtAuthGuard, RolesGuard)
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly multipartService: MultipartService
  ) {}

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
    return this.filesService.getSignedUploadUrl(user.id, body.filename, body.mimeType, body.size, body.checksum);
  }

  @Post("multipart/initiate")
  async initiateMultipart(@Body() body: MultipartInitDto, @Req() req: any) {
    const user = req.user as { id: string };
    const storageKey = `${user.id}/${Date.now()}-${body.filename}`;
    return this.multipartService.initiate(user.id, storageKey, body.mimeType);
  }

  @Post("multipart/:uploadId/part")
  async getPartUrl(
    @Param("uploadId") uploadId: string,
    @Body() body: MultipartPartDto,
    @Req() req: any
  ) {
    const user = req.user as { id: string };
    const { storageKey } = req.query as { storageKey: string };
    const url = await this.multipartService.getPartUrl(user.id, uploadId, storageKey, body.partNumber);
    return { url };
  }

  @Post("multipart/:uploadId/complete")
  async completeMultipart(
    @Param("uploadId") uploadId: string,
    @Body() body: MultipartCompleteDto,
    @Req() req: any
  ) {
    const user = req.user as { id: string };
    const { storageKey } = req.query as { storageKey: string };
    await this.multipartService.complete(user.id, uploadId, storageKey, body.parts);
    return this.filesService.finalizeMultipart(user.id, storageKey, body.filename, body.mimeType, body.size, body.checksum);
  }

  @Get(":id/signed")
  async signed(@Param("id") id: string, @Req() req: any) {
    const user = req.user as { id: string; role: string };
    return this.filesService.getSignedDownloadUrl(id, user);
  }

  @Get(":id")
  async download(@Param("id") id: string, @Req() req: any, @Res() res: Response) {
    const user = req.user as { id: string; role: string };
    const result = await this.filesService.download(id, user);
    if (!result) {
      return res.status(404).end();
    }
    res.setHeader("Content-Type", result.file.mimeType);
    res.setHeader("Content-Disposition", `attachment; filename=\"${result.file.filename}\"`);
    return result.stream.pipe(res);
  }
}
