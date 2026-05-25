import prisma from "../../core/prisma";
import { hashPassword } from "../../core/utils/password";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../core/utils/jwt";
import { Role } from "@prisma/client";
import { RegisterTenantInput } from "./tenant.schema";
import { TenantError } from "./tenant";

export class TenantService {

  static async register(input: RegisterTenantInput["body"]) {

    const username = input.admin.username.trim().toLowerCase()
    const slug = input.company.slug.trim().toLowerCase()

    const slugRegex = /^[a-z0-9-]{3,40}$/

    if (!slugRegex.test(slug)) {
      throw new Error(TenantError.INVALID_SLUG)
    }

    const hashedPassword = await hashPassword(input.admin.password)

    const invite = await prisma.tenantInvite.findUnique({
      where: { code: input.inviteCode },
    });

    if (!invite || invite.used) {
      throw new Error(TenantError.INVALID_INVITE);
    }

    if (invite.expiresAt < new Date()) {
      throw new Error(TenantError.INVITE_EXPIRED);
    }

    try {

      const result = await prisma.$transaction(async (tx) => {

        const tenant = await tx.tenant.create({
          data: {
            name: input.company.name,
            slug,
            active: true,
          },
        })

        const user = await tx.user.create({
          data: {
            tenantId: tenant.id,
            username,
            password: hashedPassword,
            name: input.admin.name,
            role: Role.ADMIN,
            active: true,
          },
        })

        const refreshToken = signRefreshToken({
          sub: user.id,
          tenantId: tenant.id,
        })

        const payload = verifyRefreshToken(refreshToken)

        await tx.refreshToken.create({
          data: {
            token: refreshToken,
            userId: user.id,
            expiresAt: new Date(payload.exp * 1000),
          },
        })

        return { tenant, user, refreshToken }
      })

      const accessToken = signAccessToken({
        sub: result.user.id,
        tenantId: result.user.tenantId,
        username: result.user.username,
        role: result.user.role,
        warehouseId: result.user.warehouseId,
      })

      return {
        tenant: {
          id: result.tenant.id,
          name: result.tenant.name,
          slug: result.tenant.slug,
        },
        user: {
          id: result.user.id,
          username: result.user.username,
          role: result.user.role,
        },
        accessToken,
        refreshToken: result.refreshToken,
      }

    } catch (error: any) {

      if (error.code === "P2002") {
        throw new Error(TenantError.ALREADY_EXISTS)
      }

      throw error
    }
  }

  static async resolveSlug(slug: string): Promise<number> {

    const normalizedSlug = slug.trim().toLowerCase();

    const tenant = await prisma.tenant.findFirst({
      where: { slug: normalizedSlug },
      select: {
        id: true,
        active: true,
      },
    });

    if (!tenant || !tenant.active) {
      throw new Error(TenantError.TENANT_NOT_FOUND);
    }

    return tenant.id;
  }
  
  static async getConfig(key: string, tenantId: number) {
    const config = await prisma.systemConfig.findUnique({
      where: { tenantId_key: { tenantId, key } },
    });
    return config?.value ?? null;
  }

  static async setConfig(key: string, value: string, tenantId: number) {
    return prisma.systemConfig.upsert({
      where: { tenantId_key: { tenantId, key } },
      update: { value },
      create: { key, value, tenantId },
    });
  }
}