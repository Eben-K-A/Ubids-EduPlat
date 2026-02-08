import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["<rootDir>/test/**/*.test.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  clearMocks: true
};

export default config;
