import { Request, Response, NextFunction } from "express";
import { ZodObject } from "zod";

export function validate(schema: ZodObject<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      return res.status(400).json({
        message: "Datos inválidos",
        errors: result.error.issues.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      });
    }

    req.body = result.data.body ?? req.body;
    req.params = (result.data.params ?? req.params) as Record<string, string>;

    next();
  };
}