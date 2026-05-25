import { Router } from "express";
import * as controller from "./user.controller";
import { authMiddleware } from "../../core/middlewares/auth.middleware";
import { roleMiddleware } from "../../core/middlewares/role.middleware";
import { validate } from "../../core/middlewares/validate.middleware";
import { asyncHandler } from "../../core/utils/asyncHandler";
import * as schema from "./user.schema";
import { Role } from "../user/roles";

const router = Router();

router.use(authMiddleware);

router.get("/", asyncHandler(controller.listUsers));

router.get(
  "/:id",
  validate(schema.userIdParamSchema),
  asyncHandler(controller.getUser)
);

router.post(
  "/",
  validate(schema.createUserSchema),
  roleMiddleware(Role.ADMIN),
  asyncHandler(controller.createUser)
);

router.put(
  "/:id",
  validate(schema.userIdParamSchema.merge(schema.updateUserSchema)),
  roleMiddleware(Role.ADMIN),
  asyncHandler(controller.updateUser)
);

router.patch(
  "/:id/activate",
  validate(schema.userIdParamSchema.merge(schema.toggleUserSchema)),
  roleMiddleware(Role.ADMIN),
  asyncHandler(controller.toggleUserActive)
);

router.post(
  "/:id/logout-all",
  validate(schema.userIdParamSchema),
  roleMiddleware(Role.ADMIN),
  asyncHandler(controller.logoutUserAll)
);

export default router;