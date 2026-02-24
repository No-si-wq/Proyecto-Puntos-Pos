import { Router } from "express";
import * as controller from "../controllers/category.controller";
import { validate } from "../middlewares/validate.middleware";
import {
  createCategorySchema,
  createHierarchySchema,
  updateCategorySchema,
} from "../validations/category.schema";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { Role } from "../types/roles";

const router = Router();

router.use(authMiddleware);

router.post(
  "/",
  validate(createCategorySchema),
  controller.create
);

router.post(
  "/hierarchy",
  validate(createHierarchySchema),
  controller.createHierarchy
);

router.post("/import", controller.importCategories);

router.get("/tree", controller.getTree);
router.get("/:id", controller.getById);
router.get("/:id/subtree", controller.getSubtree);
router.get("/:id/children", controller.getChildren);

router.put(
  "/:id",
  roleMiddleware(Role.ADMIN),
  validate(updateCategorySchema),
  controller.update
);

router.patch(
  "/:id/activate",
  roleMiddleware(Role.ADMIN),
  controller.toggleCategoryActive,
)

router.delete(
  "/:id",
  roleMiddleware(Role.ADMIN),
  controller.remove
);

export default router;