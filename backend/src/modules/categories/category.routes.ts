import { Router } from "express";
import * as controller from "./category.controller";
import { validate } from "../../core/middlewares/validate.middleware";
import * as schema from "./category.schema";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { authMiddleware } from "../../core/middlewares/auth.middleware";
import { roleMiddleware } from "../../core/middlewares/role.middleware";
import { Role } from "../user/roles";

const router = Router();

router.use(authMiddleware);

router.post(
  "/",
  validate(schema.createCategorySchema),
  asyncHandler(controller.create)
);

router.post(
  "/hierarchy",
  validate(schema.createHierarchySchema),
  asyncHandler(controller.createHierarchy)
);

router.post("/import", asyncHandler(controller.importCategories));

router.get("/tree", asyncHandler(controller.getTree));
router.get("/:id", asyncHandler(controller.getById));
router.get("/:id/subtree", asyncHandler(controller.getSubtree));
router.get("/:id/children", asyncHandler(controller.getChildren));

router.put(
  "/:id",
  roleMiddleware(Role.ADMIN),
  validate(schema.updateCategorySchema),
  asyncHandler(controller.update),
);

router.patch(
  "/:id/activate",
  roleMiddleware(Role.ADMIN),
  asyncHandler(controller.toggleCategoryActive),
)

export default router;