import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      });

      next();
    } catch (error: any) {
      return res.status(400).json({
        message: "Datos inválidos",
        errors: error.errors?.map((e: any) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      });
    }
  };
}