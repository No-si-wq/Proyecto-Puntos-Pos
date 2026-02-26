import { Router } from "express";
import * as controller from "../controllers/accountPayable.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.post("/", controller.createPayable);
router.get("/", controller.listPayables);
router.post("/:id/payments", controller.registerPayablePayment);

export default router;