import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client"
import { ZodError } from "zod";
import { logger } from "../config/logger";
import { ENV } from "../config/env";
import { InventoryError } from "../../modules/inventory/inventory";
import { SaleError } from "../../modules/sale/sale";
import { AuthError } from "../../modules/auth/auth";
import { LoyaltyError } from "../../modules/loyalty/points";
import { SupplierError } from "../../modules/supplier/supplier";
import { ProductError } from "../../modules/product/product";
import { CustomerError } from "../../modules/customer/customer";
import { CategoryError } from "../../modules/categories/category";
import { PurchaseError } from "../../modules/purchase/purchase";

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
      { 
        code: err.code, 
        message: err.message,
        meta: err.meta,
        stack: err.stack,
      },
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

      case LoyaltyError.ACCOUNT_NOT_FOUND:
        return res.status(409).json({ message: "Cuenta sin puntos" });

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

      case PurchaseError.PURCHASE_NOT_FOUND:
        return res.status(404).json({ message: "Compra no encontrada" });

       case PurchaseError.EMPTY_ITEMS:
        return res.status(400).json({ message: "La venta no tiene elementos" });

      case PurchaseError.INVALID_ITEM:
        return res.status(400).json({ message: "Producto invalido" });

      case PurchaseError.INVALID_SUPPLIER:
        return res.status(400).json({ message: "Proveedor incorrecto" })
    }
  }

  logger.error(
    {
      method: req.method,
      url: req.originalUrl,
      error: err.message,
      stack: err.stack,
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