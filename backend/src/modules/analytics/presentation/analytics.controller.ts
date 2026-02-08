import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AnalyticsService } from "../application/analytics.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";

@ApiTags("analytics")
@ApiBearerAuth()
@Controller("analytics")
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("overview")
  overview() {
    return this.analyticsService.getOverview();
  }
}
