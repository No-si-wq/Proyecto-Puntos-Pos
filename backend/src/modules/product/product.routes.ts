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

router.get(
  "/by-warehouse",
  requireWarehouse,
  asyncHandler(controller.getProductsByWarehouse)
);

router.get("/by-barcode/:code", asyncHandler(controller.getProductByBarcode));

router.post(
  "/import",
  upload.single("file"),
  asyncHandler(controller.importProducts)
);

router.post(
  "/",
  roleMiddleware(Role.ADMIN, Role.USER),
  validate(createProductSchema),
  asyncHandler(controller.createProduct)
);

router.patch(
  "/:id/point",
  asyncHandler(controller.ReorderPoint),
);

router.get(
  "/:id",
  validate(productIdParamSchema),
  asyncHandler(controller.getProduct)
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

router.get(
  "/:id/prices",
  asyncHandler(controller.getProductPrices)
);

router.put(
  "/:id/prices",
  roleMiddleware(Role.ADMIN),
  asyncHandler(controller.upsertProductPrice)
);

router.delete(
  "/:id/prices/:priceListId",
  roleMiddleware(Role.ADMIN),
  asyncHandler(controller.removeProductPrice)
);

export default router;