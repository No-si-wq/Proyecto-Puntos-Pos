import { Request, Response } from "express";
import { TenantService } from "./tenant.service";
import { TenantError } from "./tenant";

export class TenantController {

  static async register(req: Request, res: Response) {
    try {

      const result = await TenantService.register(req.body);

      return res.status(201).json(result);

    } catch (err: any) {

      if (err.message === TenantError.ALREADY_EXISTS) {
        return res.status(409).json({
          message: "El email ya está registrado"
        });
      }

      if (err.message === TenantError.SLUG_ALREADY_EXISTS) {
        return res.status(409).json({
          message: "El identificador ya está en uso"
        });
      }

      if (err.message === TenantError.REGISTRATION_DISABLED) {
        return res.status(403).json({
          message: "El registro está deshabilitado"
        });
      }

      if (err.code === "P2002") {
        return res.status(409).json({
          message: "El usuario o email ya existe"
        });
      }

      console.error("REGISTER ERROR:", {
        message: err.message,
        code: err.code,
        stack: err.stack,
      });
      return res.status(500).json({
        message: "Error interno del servidor"
      });
    }
  }

  static async getConfig(req: Request, res: Response) {
    const rawKey = req.params.key;
    const key = Array.isArray(rawKey) ? rawKey[0] : rawKey;
    const { tenantId } = req.user!; // asumiendo que tu auth middleware lo inyecta
    if (!key) {
      return res.status(400).json({ message: "La clave es requerida" });
    }

    const value = await TenantService.getConfig(key, tenantId);

    if (value === null) {
      return res.status(404).json({ message: "Configuración no encontrada" });
    }

    return res.status(200).json({ key, value });
  }

  static async setConfig(req: Request, res: Response) {
    const rawKey = req.params.key;
    const key = Array.isArray(rawKey) ? rawKey[0] : rawKey;
    const { value } = req.body;
    const { tenantId } = req.user!;;
    if (!key) {
      return res.status(400).json({ message: "La clave es requerida" });
    }

    if (value === undefined || value === null || String(value).trim() === "") {
      return res.status(400).json({ message: "El valor es requerido" });
    }

    const result = await TenantService.setConfig(key, String(value), tenantId);

    return res.status(200).json(result);
  }

  static async getFiscalConfig(req: Request, res: Response) {
    const { tenantId } = req.user!;
    const userId = req.query.userId ? Number(req.query.userId) : undefined;
    const config = await TenantService.getFiscalConfig(tenantId, userId);
    if (!config) return res.status(404).json({ message: "Sin configuración fiscal activa" });
    return res.json(config);
  }

  static async listFiscalConfigs(req: Request, res: Response) {
    const { tenantId } = req.user!;
    const configs = await TenantService.listFiscalConfigs(tenantId);
    return res.json(configs);
  }

  static async setFiscalConfig(req: Request, res: Response) {
    const { tenantId } = req.user!;
    const { userId, cai, establishment, emissionPoint, documentType, rangeStart, rangeEnd, expiresAt } = req.body;
    const config = await TenantService.setFiscalConfig(tenantId, {
      userId, cai, establishment, emissionPoint, documentType, rangeStart, rangeEnd,
      expiresAt: new Date(expiresAt),
    });
    return res.status(201).json(config);
  }
}
