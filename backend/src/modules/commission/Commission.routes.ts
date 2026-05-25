import { Router } from "express";
import * as controller from "./Commission.controller";
import { authMiddleware } from "../../core/middlewares/auth.middleware";
import { validate } from "../../core/middlewares/validate.middleware";
import * as schema from "./Commission.schema";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { Role } from "../user/roles";
import { roleMiddleware } from "../../core/middlewares/role.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/levels", asyncHandler(controller.getAllLevels));
router.get("/levels/:id", asyncHandler(controller.getLevelById));
router.post("/levels", validate(schema.createCommissionLevelSchema), asyncHandler(controller.createLevel));
router.put(
  "/levels/:id",
  roleMiddleware(Role.ADMIN),
  validate(schema.updateCommissionLevelSchema),
  asyncHandler(controller.updateLevel)
);
router.patch(
  "/levels/:id/actviate", 
  roleMiddleware(Role.ADMIN),
  asyncHandler(controller.removeLevel),
);

router.get("/", asyncHandler(controller.getAllCommissions));
router.get("/reports",  roleMiddleware(Role.ADMIN), asyncHandler(controller.getCommissionReport));
router.get("/user/:userId", asyncHandler(controller.getCommissionsByUser));
router.post("/", validate(schema.assignCommissionSchema), asyncHandler(controller.assignCommission));
router.put("/:id", 
  validate(schema.updateCommissionSchema), 
  roleMiddleware(Role.ADMIN),
  asyncHandler(controller.updateCommission)
);
router.patch(
  "/:id/activate", 
  roleMiddleware(Role.ADMIN),
  asyncHandler(controller.removeCommission),
);

export default router;