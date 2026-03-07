import jwt, { JwtPayload as JwtLibPayload, SignOptions } from "jsonwebtoken";
import { ENV } from "../config/env";

if (!ENV.JWT_SECRET || !ENV.REFRESH_SECRET) {
  throw new Error("JWT secrets are not defined");
}

const JWT_SECRET = ENV.JWT_SECRET;
const REFRESH_SECRET = ENV.REFRESH_SECRET;

export interface AccessTokenPayload {
  sub: number;
  role: string;
  username: string;
  exp: number;
  iat: number;
}

export interface RefreshTokenPayload {
  sub: number;
  exp: number;
  iat: number;
}

function isAccessTokenPayload(payload: unknown): payload is AccessTokenPayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    typeof (payload as any).sub === "number" &&
    typeof (payload as any).role === "string" &&
    typeof (payload as any).username === "string"
  );
}

function isRefreshTokenPayload(payload: unknown): payload is RefreshTokenPayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    typeof (payload as any).sub === "number"
  );
}

export function signAccessToken(
  payload: Omit<AccessTokenPayload, "iat" | "exp">,
  expiresIn: SignOptions["expiresIn"] = "8h"
): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function signRefreshToken(
  payload: Pick<RefreshTokenPayload, "sub">,
  expiresIn: SignOptions["expiresIn"] = "8h"
): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, JWT_SECRET);
  if (!isAccessTokenPayload(decoded)) {
    throw new Error("Invalid access token");
  }
  return decoded;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const decoded = jwt.verify(token, REFRESH_SECRET);
  if (!isRefreshTokenPayload(decoded)) {
    throw new Error("Invalid refresh token");
  }
  return decoded;
}

export function decodeToken(token: string): AccessTokenPayload {
  const decoded = jwt.decode(token);
  if (!isAccessTokenPayload(decoded)) {
    throw new Error("Invalid token");
  }
  return decoded;
}