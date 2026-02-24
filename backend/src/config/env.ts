import dotenv from "dotenv";

const NODE_ENV = process.env.NODE_ENV ?? "development";

if (NODE_ENV !== "production") {
  dotenv.config();
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variable de entorno faltante: ${name}`);
  }
  return value;
}

function encode(value: string): string {
  return encodeURIComponent(value);
}

let DATABASE_URL: string;

if (NODE_ENV === "production") {
  const DB_HOST = requireEnv("DB_HOST");
  const DB_PORT = requireEnv("DB_PORT");
  const DB_NAME = requireEnv("DB_NAME");
  const DB_USER = requireEnv("DB_USER");
  const DB_PASS = requireEnv("DB_PASS");

  DATABASE_URL =
    `postgresql://${encode(DB_USER)}:` +
    `${encode(DB_PASS)}@` +
    `${DB_HOST}:${DB_PORT}/` +
    `${encode(DB_NAME)}`;
} else {
  if (process.env.DATABASE_URL) {
    DATABASE_URL = process.env.DATABASE_URL;
  } else {
    const DB_HOST = requireEnv("DB_HOST");
    const DB_PORT = requireEnv("DB_PORT");
    const DB_NAME = requireEnv("DB_NAME");
    const DB_USER = requireEnv("DB_USER");
    const DB_PASS = requireEnv("DB_PASS");

    DATABASE_URL =
      `postgresql://${encode(DB_USER)}:` +
      `${encode(DB_PASS)}@` +
      `${DB_HOST}:${DB_PORT}/` +
      `${encode(DB_NAME)}`;
  }
}

process.env.DATABASE_URL = DATABASE_URL;

export const ENV = {
  NODE_ENV,
  PORT: Number(process.env.PORT ?? 3000),

  DATABASE_URL,

  JWT_SECRET: requireEnv("JWT_SECRET"),
  REFRESH_SECRET: requireEnv("REFRESH_SECRET"),
};