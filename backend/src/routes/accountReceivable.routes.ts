import { Router } from "express";
import * as controller from "../controllers/accountReceivable.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.post("/", controller.createReceivable);
router.get("/", controller.listReceivables);
router.get("/:id", controller.getReceivable);
router.post("/:id/payments", controller.registerReceivablePayment);
router.get(
  "/customer/:customerId/summary",
  controller.customerSummary
);

export default router;