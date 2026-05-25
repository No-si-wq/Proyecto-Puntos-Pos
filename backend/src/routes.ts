import { Router } from "express";

import authRoutes from "./modules/auth/auth.routes";
import userRoutes from "./modules/user/user.routes";
import customerRoutes from "./modules/customer/customer.routes";
import productRoutes from "./modules/product/product.routes";
import inventoryRoutes from "./modules/inventory/inventory.routes";
import purchaseRoutes from "./modules/purchase/purchase.routes";
import saleRoutes from "./modules/sale/sale.routes";
import supplierRoutes from "./modules/supplier/supplier.routes";
import categoryRoutes from "./modules/categories/category.routes";
import reportRoutes from "./modules/reports/report.routes";
import warehouseRoutes from "./modules/warehouse/warehouse.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import accountReceivableRoutes from "./modules/accounts-receivable/accountReceivable.routes";
import accountPayableRoutes from "./modules/accounts-payable/accountPayable.routes";
import tenantRoutes from "./modules/tenant/tenant.routes";
import priceListRoutes from "./modules/price-list/Pricelist.routes";
import commissionRoutes from "./modules/commission/Commission.routes";
import reportTemplateRouter from "./modules/report-template/report-template.router";
import remissionRoutes from './modules/remission/remission.routes';
import quotationRoutes from './modules/quotation/quotation.routes';

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
router.use("/tenants", tenantRoutes);
router.use("/priceLists", priceListRoutes);
router.use("/commissions", commissionRoutes);
router.use("/report-templates", reportTemplateRouter);
router.use('/remissions', remissionRoutes);
router.use('/quotations', quotationRoutes);

export default router;