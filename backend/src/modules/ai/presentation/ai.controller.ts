import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AiService } from "../application/ai.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { AiRequestDto } from "../dto/ai-request.dto";

@ApiTags("ai")
@ApiBearerAuth()
@Controller("ai")
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post("assist")
  request(@Body() body: AiRequestDto, @Req() req: any) {
    const user = req.user as { id: string };
    return this.aiService.requestAssistance({ userId: user.id, prompt: body.prompt, provider: body.provider, model: body.model });
  }
}
