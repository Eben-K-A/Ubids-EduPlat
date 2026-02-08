import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  REDIS_HOST: z.string().default("127.0.0.1"),
  REDIS_PORT: z.coerce.number().default(6379),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.coerce.number().default(900),
  JWT_REFRESH_TTL: z.coerce.number().default(1209600),
  FILE_STORAGE_PATH: z.string().default("./data/uploads"),
  FILE_STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  S3_SIGNED_URL_TTL: z.coerce.number().default(900),
  AI_SERVICE_URL: z.string().optional(),
  AI_SERVICE_KEY: z.string().optional()
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  return envSchema.parse(config);
}

export const configuration = () => {
  const env = validateEnv(process.env);
  return {
    app: {
      env: env.NODE_ENV,
      port: env.PORT
    },
    db: {
      url: env.DATABASE_URL
    },
    redis: {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT
    },
    jwt: {
      accessSecret: env.JWT_ACCESS_SECRET,
      refreshSecret: env.JWT_REFRESH_SECRET,
      accessTtl: env.JWT_ACCESS_TTL,
      refreshTtl: env.JWT_REFRESH_TTL
    },
    files: {
      storagePath: env.FILE_STORAGE_PATH,
      driver: env.FILE_STORAGE_DRIVER,
      s3: {
        bucket: env.S3_BUCKET,
        region: env.S3_REGION,
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
        endpoint: env.S3_ENDPOINT,
        signedUrlTtl: env.S3_SIGNED_URL_TTL
      }
    },
    ai: {
      url: env.AI_SERVICE_URL,
      key: env.AI_SERVICE_KEY
    }
  };
};
