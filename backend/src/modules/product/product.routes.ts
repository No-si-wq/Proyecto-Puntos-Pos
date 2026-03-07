import { Router } from "express";
import * as controller from "./product.controller";
import { authMiddleware } from "../../core/middlewares/auth.middleware";
import { roleMiddleware } from "../../core/middlewares/role.middleware";
import { requireWarehouse } from "../../core/middlewares/warehouse.middleware";
import { validate } from "../../core/middlewares/validate.middleware";
import { asyncHandler } from "../../core/utils/asyncHandler";
import multer from "multer";
import {
  createProductSchema,
  updateProductSchema,
  productIdParamSchema,
} from "./product.schema";
import { Role } from "../user/roles";

const upload = multer({ dest: "uploads/" });

const router = Router();

router.use(authMiddleware);

router.get("/", asyncHandler(controller.listProducts));

router.post(
  "/import",
  upload.single("file"),
  asyncHandler(controller.importProducts)
);

router.get(
  "/by-warehouse",
  requireWarehouse,
  asyncHandler(controller.getProductsByWarehouse),
);

router.get(
  "/:id",
  roleMiddleware(Role.ADMIN, Role.USER),
  validate(productIdParamSchema),
  asyncHandler(controller.getProduct),
);

router.get("/by-barcode/:code", asyncHandler(controller.getProductByBarcode));

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
  asyncHandler(controller.updateProduct)
);

router.patch(
  "/:id/activate",
  roleMiddleware(Role.ADMIN),
  validate(productIdParamSchema),
  asyncHandler(controller.toggleProductActive)
);

export default router;