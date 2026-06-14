import { Router } from "express";
import * as controller from "./customer.controller";
import { authMiddleware } from "../../core/middlewares/auth.middleware";
import { roleMiddleware } from "../../core/middlewares/role.middleware";
import { validate } from "../../core/middlewares/validate.middleware";
import { asyncHandler } from "../../core/utils/asyncHandler";
import * as schema from "./customer.schema";
import { Role } from "../user/roles";

const router = Router();

router.use(authMiddleware);

router.get(
  "/",
  roleMiddleware(Role.ADMIN, Role.USER, Role.SELLER),
  asyncHandler(controller.listCustomers)
);

router.get(
  "/:id",
  roleMiddleware(Role.ADMIN, Role.USER, Role.SELLER),
  validate(schema.customerIdParamSchema),
  asyncHandler(controller.getCustomer)
);

router.post(
  "/",
  roleMiddleware(Role.ADMIN, Role.USER),
  validate(schema.createCustomerSchema),
  asyncHandler(controller.createCustomer),
);

router.get(
  "/:id/credit-status",
  roleMiddleware(Role.ADMIN, Role.USER),
  validate(schema.customerIdParamSchema),
  asyncHandler(controller.getCustomerCreditStatus)
);

router.put(
  "/:id",
  roleMiddleware(Role.ADMIN, Role.USER),
  validate(schema.updateCustomerSchema),
  asyncHandler(controller.updateCustomer),
);

router.patch(
  "/:id/activate",
  roleMiddleware(Role.ADMIN),
  validate(schema.customerIdParamSchema.merge(schema.toggleCustomerSchema)),
  asyncHandler(controller.toggleCustomerActive),
);

export default router;