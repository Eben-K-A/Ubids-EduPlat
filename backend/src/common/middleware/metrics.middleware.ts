import type { Request, Response, NextFunction } from "express";
import { Histogram, Registry, collectDefaultMetrics } from "prom-client";

export const metricsRegistry = new Registry();
collectDefaultMetrics({ register: metricsRegistry });

export const httpRequestDuration = new Histogram({
  name: "http_server_requests_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status"],
  registers: [metricsRegistry]
});

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime();
  res.on("finish", () => {
    const diff = process.hrtime(start);
    const duration = diff[0] + diff[1] / 1e9;
    const route = (req.route && req.route.path) || req.path || "unknown";
    httpRequestDuration
      .labels(req.method, route, String(res.statusCode))
      .observe(duration);
  });
  next();
}
