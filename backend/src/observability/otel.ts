import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";

const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
const serviceName = process.env.OTEL_SERVICE_NAME || "ubids-eduplat-backend";

const traceExporter = endpoint ? new OTLPTraceExporter({ url: endpoint }) : undefined;

const sdk = new NodeSDK({
  serviceName,
  traceExporter,
  instrumentations: [getNodeAutoInstrumentations()]
});

sdk.start();

process.on("SIGTERM", async () => {
  await sdk.shutdown();
});
