import prisma from "../../core/prisma";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  decodeToken,
} from "../../core/utils/jwt";
import { Role } from "@prisma/client";
import { comparePassword } from "../../core/utils/password";
import { AuthError } from "./auth";

export interface LoginInput {
  username: string;
  password: string;
  tenantId: number;
}

export interface AuthUser {
  id: number;
  name: string | null;
  warehouseId: number | null;
  username: string;
  role: Role;
  tenantId: number;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  warehouseId: number | null;
}

export class AuthService {
  static async login(input: LoginInput): Promise<LoginResult> {
    const { username, password, tenantId } = input;

    const user = await prisma.user.findUnique({
      where: {
        tenantId_username: { tenantId, username },
      },
    });

    if (!user || !user.active) {
      throw new Error(AuthError.INVALID_CREDENTIALS);
    }

    const passwordMatch = await comparePassword(password, user.password);
    if (!passwordMatch) {
      throw new Error(AuthError.INVALID_CREDENTIALS);
    }

    const accessToken = signAccessToken({
      sub: user.id,
      tenantId: user.tenantId,
      username: user.username,
      role: user.role,
      warehouseId: user.warehouseId,
    });

    const refreshToken = signRefreshToken({
      sub: user.id,
      tenantId: user.tenantId,
    });

    return {
      user: {
        id: user.id,
        tenantId: user.tenantId,
        name: user.name,
        warehouseId: user.warehouseId,
        role: user.role,
        username: user.username,
      },
      accessToken,
      refreshToken,
      warehouseId: user.warehouseId,
    };
  }

  static async logout(token: string): Promise<void> {
    const payload = decodeToken(token);

    const expiresAt = new Date(payload.exp * 1000);

    await prisma.revokedToken.create({
      data: {
        token,
        expiresAt,
      },
    });
  }

  static async logoutGlobal(userId: number): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        tokenVersionAt: new Date(),
      },
    });
  }

  static async issueTokens(user: {
    id: number;
    tenantId: number;
    username: string;
    role: Role;
    warehouseId: number | null;
  }): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = signAccessToken({
      sub: user.id,
      tenantId: user.tenantId,
      username: user.username,
      role: user.role,
      warehouseId: user.warehouseId,
    });

    const refreshToken = signRefreshToken({
      sub: user.id,
      tenantId: user.tenantId,
    });

    const payload = verifyRefreshToken(refreshToken);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(payload.exp * 1000),
      },
    });

    return { accessToken, refreshToken };
  }

  static async rotateRefreshToken(oldToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const payload = verifyRefreshToken(oldToken);

    const stored = await prisma.refreshToken.findUnique({
      where: { token: oldToken },
    });

    if (!stored || stored.revoked) {
      await prisma.refreshToken.updateMany({
        where: { userId: payload.sub },
        data: { revoked: true },
      });
      throw new Error("REFRESH_TOKEN_REUSE");
    }

    await prisma.refreshToken.update({
      where: { token: oldToken },
      data: { revoked: true },
    });

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        tenantId: true,
        warehouseId: true,
        username: true,
        role: true,
        active: true,
      },
    });

    if (!user || !user.active) {
      throw new Error("USER_INVALID");
    }

    return this.issueTokens(user);
  }

  static async revokeAllRefreshTokens(userId: number): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { revoked: true },
    });
  }
}