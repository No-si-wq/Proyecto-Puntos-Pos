import { Router } from "express";
import * as controller from "../controllers/report.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireWarehouse } from "../middlewares/warehouse.middleware";

const router = Router();

router.use(authMiddleware);
router.use(requireWarehouse);

router.get("/purchase", controller.getPurchaseLotsReport);

export default router;