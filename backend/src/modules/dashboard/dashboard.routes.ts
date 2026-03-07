import Router from "express"
import * as controller from "./dashboard.controller";
import { authMiddleware } from "../../core/middlewares/auth.middleware";
import { requireWarehouse} from "../../core/middlewares/warehouse.middleware";
import { requireAdmin } from "../../core/middlewares/admin.middleware";
import { dashboardQuerySchema } from "./dashboard.schema";
import { validate } from "../../core/middlewares/validate.middleware";
import { asyncHandler } from "../../core/utils/asyncHandler";

const router = Router();

router.use(authMiddleware);

router.get(
  "/", 
  requireWarehouse,
  asyncHandler(controller.getDashboard)
);

router.get(
  "/admin",
  validate(dashboardQuerySchema),
  requireAdmin,
  asyncHandler(controller.getAdminDashboard,)
)

export default router; 