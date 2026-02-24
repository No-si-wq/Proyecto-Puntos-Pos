import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { logger } from "../config/logger";
import { ENV } from "../config/env";
import { InventoryError } from "../types/inventory";
import { SaleError } from "../types/sale";
import { AuthError } from "../types/auth";
import { LoyaltyError } from "../types/points";
import { SupplierError } from "../types/supplier";
import { ProductError } from "../types/product";
import { CustomerError } from "../types/customer";
import { CategoryError } from "../types/category";

export function errorMiddleware(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  
    if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Datos inválidos",
      errors: err.issues.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      })),
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    logger.error(
      { code: err.code, meta: err.meta },
      "Prisma known error"
    );

    if (err.code === "P2002") {
      return res.status(409).json({
        message: "Registro duplicado",
      });
    }

    if (err.code === "P2025") {
      return res.status(404).json({
        message: "Registro no encontrado",
      });
    }

    return res.status(400).json({
      message: "Error de base de datos",
    });
  }

  if (typeof err?.message === "string") {
    switch (err.message) {
      case AuthError.INVALID_CREDENTIALS:
        return res.status(401).json({ message: "Credenciales inválidas" });

      case InventoryError.INSUFFICIENT_STOCK:
        return res.status(409).json({ message: "Stock insuficiente" });

      case InventoryError.INVALID_QUANTITY:
        return res.status(400).json({ message: "Cantidad inválida" });

      case SaleError.PRODUCT_NOT_AVAILABLE:
        return res.status(400).json({ message: "Producto no disponible" });

      case SaleError.EMPTY_SALE:
        return res.status(400).json({ message: "La venta no tiene items" });

      case SaleError.INVALID_TOTAL:
        return res.status(400).json({ message: "Total inválido" });

      case SaleError.SALE_NOT_FOUND:
        return res.status(404).json({ message: "Venta no encontrada" });

      case LoyaltyError.INSUFFICIENT_POINTS:
        return res.status(409).json({ message: "Puntos insuficientes" });

      case SupplierError.DUPLICATE_SUPPLIER: 
        return res.status(400).json({ message: "Proveedor duplicado" });

      case SupplierError.SUPPLIER_NOT_FOUND:
        return res.status(404).json({ message: "Proveedor no encontrado" });

      case ProductError.INVALID_CATEGORY:
        return res.status(400).json({ message: "Categoria invalida o inactiva" });

      case ProductError.DUPLICATE_BARCODE:
        return res.status(409).json({ message: "Codigo duplicado" });

      case ProductError.CATEGORY_NOT_LEAF:
        return res.status(400).json({ message: "La categoria no tiene hijo" });  

      case CustomerError.DUPLICATE_CUSTOMER:
        return res.status(409).json({ message: "Codigo duplicado" });

      case CategoryError.EMPTY_LEVELS:
        return res.status(400).json({ message: "Niveles vacíos" });

      case CategoryError.ROOT_NOT_FOUND:
        return res.status(404).json({ message: "Categoría raíz no válida" });

      case CategoryError.CATEGORY_NOT_FOUND:
        return res.status(404).json({ message: "Categoría no encontrada" });
      
      case CategoryError.CATEGORY_HAS_CHILDREN:
        return res.status(400).json({ message: "No se puede eliminar una categoría con subcategorías activas" });
    }
  }

  logger.error(
    {
      method: req.method,
      url: req.originalUrl,
      error: err,
    },
    "Unhandled error"
  );

  return res.status(500).json({
    message: "Error interno del servidor",
    ...(ENV.NODE_ENV === "development" && {
      stack: err?.stack,
    }),
  });
}