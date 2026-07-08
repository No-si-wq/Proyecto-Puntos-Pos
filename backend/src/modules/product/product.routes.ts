import { Router } from "express";
import * as controller from "./product.controller";
import { authMiddleware } from "../../core/middlewares/auth.middleware";
import { roleMiddleware } from "../../core/middlewares/role.middleware";
import { requireWarehouse } from "../../core/middlewares/warehouse.middleware";
import { validate } from "../../core/middlewares/validate.middleware";
import { parseFormData } from "../../core/middlewares/parseFormData.middleware";
import { asyncHandler } from "../../core/utils/asyncHandler";
import multer from "multer";
import * as schema from "./product.schema";
import { Role } from "../user/roles";

const upload = multer({ dest: "uploads/" });

const uploadProductImage = multer({
  storage: multer.diskStorage({
    destination: "uploads/products/",
    filename: (_req, file, cb) => {
      const ext = file.originalname.split(".").pop();
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`);
    },
  }),
  fileFilter: (_req, file, cb) => {
   if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Solo se permiten imágenes"));
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

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
   uploadProductImage.single("image"),
   parseFormData,
   validate(schema.createProductSchema),
   asyncHandler(controller.createProduct)
 );

router.patch(
  "/:id/point",
  asyncHandler(controller.ReorderPoint),
);

router.get(
  "/:id",
  asyncHandler(controller.getProduct)
);

router.put(
   "/:id",
   roleMiddleware(Role.ADMIN),
   uploadProductImage.single("image"),
   parseFormData,
   validate(schema.productIdParamSchema.merge(schema.updateProductSchema)),
   asyncHandler(controller.updateProduct)
 );

router.patch(
  "/:id/activate",
  roleMiddleware(Role.ADMIN),
  validate(schema.productIdParamSchema),
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