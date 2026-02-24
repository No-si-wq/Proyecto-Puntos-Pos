import { Router } from "express";
import * as controller from "../controllers/warehouse.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { Role } from "../types/roles";

const router = Router();

router.use(authMiddleware);

router.get("/", controller.getWarehouses);
router.get("/:id", controller.getWarehouse);

router.post(
  "/",
  roleMiddleware(Role.ADMIN),
  controller.createWarehouse
);

router.patch(
  "/:id",
  roleMiddleware(Role.ADMIN),
  controller.updateWarehouse
);

router.delete(
  "/:id",
  roleMiddleware(Role.ADMIN),
  controller.deleteWarehouse
);

export default router;