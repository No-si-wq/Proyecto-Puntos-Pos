import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import customerRoutes from "./customer.routes";
import productRoutes from "./product.routes";
import inventoryRoutes from "./inventory.routes";
import purchaseRoutes from "./purchase.routes"
import saleRoutes from "./sale.routes";
import supplierRoutes from "./supplier.routes";
import categoryRoutes from "./category.routes"
import reportRoutes from "./report.routes";
import warehouseRoutes from "./warehouse.routes";
import dashboardRoutes from "./dashboard.routes";
import accountReceivableRoutes from "./accountReceivable.routes";
import accountPayableRoutes from "./accountPayable.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/customers", customerRoutes);
router.use("/products", productRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/purchases", purchaseRoutes);
router.use("/sales", saleRoutes);
router.use("/suppliers", supplierRoutes);
router.use("/categories", categoryRoutes);
router.use("/reports", reportRoutes);
router.use("/warehouses", warehouseRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/account-receivable", accountReceivableRoutes);
router.use("/account-payable", accountPayableRoutes);

export default router;