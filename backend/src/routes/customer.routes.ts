import { Router } from "express";
import {
  listCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  toggleCustomerActive,
} from "../controllers/customer.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerIdParamSchema,
  toggleCustomerSchema,
} from "../validations/customer.schema";
import { Role } from "../types/roles";

const router = Router();

router.use(authMiddleware);

router.get(
  "/",
  roleMiddleware(Role.ADMIN, Role.USER),
  listCustomers
);

router.get(
  "/:id",
  roleMiddleware(Role.ADMIN, Role.USER),
  validate(customerIdParamSchema),
  getCustomer
);

router.post(
  "/",
  roleMiddleware(Role.ADMIN, Role.USER),
  validate(createCustomerSchema),
  createCustomer
);

router.put(
  "/:id",
  roleMiddleware(Role.ADMIN, Role.USER),
  validate(customerIdParamSchema.merge(updateCustomerSchema)),
  updateCustomer
);

router.patch(
  "/:id/activate",
  roleMiddleware(Role.ADMIN),
  validate(customerIdParamSchema.merge(toggleCustomerSchema)),
  toggleCustomerActive
);

export default router;