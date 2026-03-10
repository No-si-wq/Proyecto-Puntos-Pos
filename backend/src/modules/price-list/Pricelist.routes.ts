import { Router } from "express";
import * as controller from "./Pricelist.controller";
import { authMiddleware } from "../../core/middlewares/auth.middleware";
import { validate } from "../../core/middlewares/validate.middleware";
import { createPriceListSchema, updatePriceListSchema } from "./Pricelist.schema";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { roleMiddleware } from "../../core/middlewares/role.middleware";
import { Role } from "../user/roles";

const router = Router();

router.use(authMiddleware);

router.get("/", asyncHandler(controller.getAll));
router.get("/:id", asyncHandler(controller.getById));

router.post(
  "/",
  validate(createPriceListSchema),
  asyncHandler(controller.create)
);

router.put(
  "/:id",
  roleMiddleware(Role.ADMIN),
  validate(updatePriceListSchema),
  asyncHandler(controller.update)
);

router.patch(
  "/:id/activate",
  roleMiddleware(Role.ADMIN),
  asyncHandler(controller.togglePriceList)
);

router.put(
  "/:id/products",
  asyncHandler(controller.upsertProductPrice)
);

router.delete(
  "/:id/products/:productId",
  asyncHandler(controller.removeProductPrice)
);

export default router;