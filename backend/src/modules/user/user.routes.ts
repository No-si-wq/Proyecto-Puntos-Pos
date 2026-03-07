import { Router } from "express";
import * as controller from "./user.controller";
import { authMiddleware } from "../../core/middlewares/auth.middleware";
import { roleMiddleware } from "../../core/middlewares/role.middleware";
import { validate } from "../../core/middlewares/validate.middleware";
import { asyncHandler } from "../../core/utils/asyncHandler";
import {
  createUserSchema,
  updateUserSchema,
  toggleUserSchema,
  userIdParamSchema,
} from "./user.schema";
import { Role } from "../user/roles";

const router = Router();

router.use(authMiddleware, roleMiddleware(Role.ADMIN));

router.get("/", asyncHandler(controller.listUsers));

router.get(
  "/:id",
  validate(userIdParamSchema),
  asyncHandler(controller.getUser)
);

router.post(
  "/",
  validate(createUserSchema),
  asyncHandler(controller.createUser)
);

router.put(
  "/:id",
  validate(userIdParamSchema.merge(updateUserSchema)),
  asyncHandler(controller.updateUser)
);

router.patch(
  "/:id/activate",
  validate(userIdParamSchema.merge(toggleUserSchema)),
  asyncHandler(controller.toggleUserActive)
);

router.post(
  "/:id/logout-all",
  validate(userIdParamSchema),
  asyncHandler(controller.logoutUserAll)
);

export default router;