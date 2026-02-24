import { Router } from "express";
import {
  listSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
} from "../controllers/supplier.controller";

import { validate } from "../middlewares/validate.middleware";
import {
  createSupplierSchema,
  updateSupplierSchema,
} from "../validations/supplier.schema";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware)

router.get("/", listSuppliers);
router.get("/:id", getSupplier);
router.post("/", validate(createSupplierSchema), createSupplier);
router.put("/:id", validate(updateSupplierSchema), updateSupplier);

export default router;