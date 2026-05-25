import { Router } from "express";
import * as controller from "./report-template.controller";
import { authMiddleware } from "../../core/middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", controller.list);
router.get("/default", controller.getDefault);
router.get("/default-by-type", controller.getDefaultByType);
router.get("/:id", controller.getReportById);
router.post("/", controller.createReport);
router.put("/:id", controller.updateReport);
router.post("/:id/duplicate", controller.duplicateReport);
router.delete("/:id", controller.deleteReport);

export default router;