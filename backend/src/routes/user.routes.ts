import { Router } from "express";
import {
  listUsers,
  getUser,
  createUser,
  updateUser,
  toggleUserActive,
  logoutUserAll,
} from "../controllers/user.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  createUserSchema,
  updateUserSchema,
  toggleUserSchema,
  userIdParamSchema,
} from "../validations/user.schema";
import { Role } from "../types/roles";

const router = Router();

router.use(authMiddleware, roleMiddleware(Role.ADMIN));

router.get("/", listUsers);

router.get(
  "/:id",
  validate(userIdParamSchema),
  getUser
);

router.post(
  "/",
  validate(createUserSchema),
  createUser
);

router.put(
  "/:id",
  validate(userIdParamSchema.merge(updateUserSchema)),
  updateUser
);

router.patch(
  "/:id/activate",
  validate(userIdParamSchema.merge(toggleUserSchema)),
  toggleUserActive
);

router.post(
  "/:id/logout-all",
  validate(userIdParamSchema),
  logoutUserAll
);

export default router;