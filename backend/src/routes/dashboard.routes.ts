import Router from "express"
import * as controller from "../controllers/dashboard.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireWarehouse} from "../middlewares/warehouse.middleware";
import { requireAdmin } from "../middlewares/admin.middleware";
import { dashboardQuerySchema } from "../validations/dashboard.schema";
import { validate } from "../middlewares/validate.middleware";

const router = Router();

router.use(authMiddleware);

router.get(
  "/", 
  requireWarehouse,
  controller.getDashboard
);

router.get(
  "/admin",
  validate(dashboardQuerySchema),
  requireAdmin,
  controller.getAdminDashboard,
)

export default router; 