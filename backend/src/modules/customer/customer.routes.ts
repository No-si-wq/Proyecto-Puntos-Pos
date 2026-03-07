import { Router } from "express";
import * as controller from "./customer.controller";
import { authMiddleware } from "../../core/middlewares/auth.middleware";
import { roleMiddleware } from "../../core/middlewares/role.middleware";
import { validate } from "../../core/middlewares/validate.middleware";
import { asyncHandler } from "../../core/utils/asyncHandler";
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerIdParamSchema,
  toggleCustomerSchema,
} from "./customer.schema";
import { Role } from "../user/roles";

const router = Router();

router.use(authMiddleware);

router.get(
  "/",
  roleMiddleware(Role.ADMIN, Role.USER),
  asyncHandler(controller.listCustomers)
);

router.get(
  "/:id",
  roleMiddleware(Role.ADMIN, Role.USER),
  validate(customerIdParamSchema),
  asyncHandler(controller.getCustomer)
);

router.post(
  "/",
  roleMiddleware(Role.ADMIN, Role.USER),
  validate(createCustomerSchema),
  asyncHandler(controller.createCustomer)
);

router.put(
  "/:id",
  roleMiddleware(Role.ADMIN, Role.USER),
  validate(customerIdParamSchema.merge(updateCustomerSchema)),
  asyncHandler(controller.updateCustomer)
);

router.patch(
  "/:id/activate",
  roleMiddleware(Role.ADMIN),
  validate(customerIdParamSchema.merge(toggleCustomerSchema)),
  asyncHandler(controller.toggleCustomerActive)
);

export default router;