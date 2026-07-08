import { Request, Response, NextFunction } from "express";

export function parseFormData(req: Request, res: Response, next: NextFunction) {
  if (req.is("multipart/form-data") && typeof req.body?.data === "string") {
    try {
      req.body = JSON.parse(req.body.data);
    } catch {
      return res.status(400).json({ message: "Datos de formulario inválidos" });
    }
  }
  next();
}