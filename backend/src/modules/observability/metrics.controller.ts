import { Controller, Get, Header, UseGuards } from "@nestjs/common";
import { metricsRegistry } from "../../common/middleware/metrics.middleware";
import { ApiKeyGuard } from "../../common/guards/api-key.guard";

@Controller("metrics")
@UseGuards(ApiKeyGuard)
export class MetricsController {
  @Get()
  @Header("Content-Type", metricsRegistry.contentType)
  async metrics() {
    return metricsRegistry.metrics();
  }
}
