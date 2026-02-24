import { Router } from "express";
import * as controller from "../controllers/product.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { requireWarehouse } from "../middlewares/warehouse.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  createProductSchema,
  updateProductSchema,
  productIdParamSchema,
} from "../validations/product.schema";
import { Role } from "../types/roles";

const router = Router();

router.use(authMiddleware);

router.get("/", controller.listProducts);

router.get(
  "/by-warehouse",
  requireWarehouse,
  controller.getProductsByWarehouse,
);

router.get(
  "/:id",
  roleMiddleware(Role.ADMIN, Role.USER),
  validate(productIdParamSchema),
  controller.getProduct,
);

router.get("/by-barcode/:code", controller.getProductByBarcode);

router.post(
  "/",
  roleMiddleware(Role.ADMIN, Role.USER),
  validate(createProductSchema),
  controller.createProduct
);

router.put(
  "/:id",
  roleMiddleware(Role.ADMIN),
  validate(productIdParamSchema.merge(updateProductSchema)),
  controller.updateProduct
);

router.patch(
  "/:id/activate",
  roleMiddleware(Role.ADMIN),
  validate(productIdParamSchema),
  controller.toggleProductActive
);

export default router;