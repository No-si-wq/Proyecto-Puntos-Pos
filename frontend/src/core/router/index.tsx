import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import AuthLayout from "../layouts/AuthLayout";

import ProtectedRoute from "../auth/ProtectedRoute";

import Login from "../../modules/auth/Login";
import Dashboard from "../../modules/dashboard/Dashboard";
import Users from "../../modules/users/Users";
import Customers from "../../modules/customers/Customers";
import Products from "../../modules/products/pages/Products";
import Purchases from "../../modules/purchases/pages/Purchases";
import Sales from "../../modules/sales/pages/Sales";
import Suppliers from "../../modules/suppliers/Suppliers";
import PurchaseLotsReportPage from "../../modules/reports/PurchaseLotsReportPage";
import Categories from "../../modules/categories/Categories";
import PurchaseHistory from "../../modules/purchases/pages/PurchaseHistory";
import SaleHistory from "../../modules/sales/pages/SaleHistory";
import InventoryPage from "../../modules/inventory/pages/Inventory";
import InventoryList from "../../modules/inventory/pages/InventroyList";
import Warehouses from "../../modules/warehouses/warehouses";
import AdminDashboard from "../../modules/dashboard/AdminDashboard";
import AccountsReceivable from "../../modules/accounts-receivable/AccountsReceivable";
import AccountsPayable from "../../modules/accounts-payable/AccountsPayable";
import Kardex from "../../modules/reports/Kardex";
import ProfitReport from "../../modules/reports/ProfitReport";
import SaleDetail from "../../modules/sales/pages/SaleDetail";
import PurchaseDetail from "../../modules/purchases/pages/PurchaseDetail";
import PriceLists from "../../modules/priceLists/pages/PriceLists";
import Commissions from "../../modules/commissions/pages/Commissions";
import CommissionReport from "../../modules/commissions/pages/CommissionReport";
import CommissionUserDetail from "../../modules/commissions/pages/CommissionUserDetail";

import Unauthorized from "../../modules/Unauthorized";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <AuthLayout>
              <Login />
            </AuthLayout>
          }
        />

        <Route element={<MainLayout />}>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute module="dashboard">
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute module="dashboard_admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/users"
            element={
              <ProtectedRoute module="users">
                <Users />
              </ProtectedRoute>
            }
          />

          <Route 
            path="/commissionReports"
            element={
              <ProtectedRoute module="commissionReport">
                <CommissionReport />
              </ProtectedRoute>
            }
          />

          <Route path="/commissions/user/:userId" element={<CommissionUserDetail />} />

          <Route
            path="/customers"
            element={
              <ProtectedRoute module="customers">
                <Customers />
              </ProtectedRoute>
            }
          />

          <Route 
            path="/accounts-receivable"
            element={
              <ProtectedRoute module="accountsReceivable">
                <AccountsReceivable />
              </ProtectedRoute>
            }
          />

          <Route
            path="/products"
            element={
              <ProtectedRoute module="products">
                <Products />
              </ProtectedRoute>
            }
          />

          <Route
            path="/inventory"
            element={
              <ProtectedRoute module="inventory">
                <InventoryList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/inventory/:productId"
            element={
              <ProtectedRoute>
                <InventoryPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/purchases"
            element={
              <ProtectedRoute module="purchases">
                <Purchases />
              </ProtectedRoute>
            }
          />

          <Route
            path= "/purchases/history"
            element={
              <ProtectedRoute module="purchasehistory">
                <PurchaseHistory />
              </ProtectedRoute>
            }
          />

          <Route path="/purchases/:id" element={<PurchaseDetail />} />

          <Route
            path="/purchases-report"
            element={
              <ProtectedRoute module="purchasesreport">
                <PurchaseLotsReportPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/sales"
            element={
              <ProtectedRoute module="sales">
                <Sales />
              </ProtectedRoute>
            }
          />

          <Route 
            path="/sales/history"
            element={
              <ProtectedRoute  module="salehistory">
                <SaleHistory />
              </ProtectedRoute>
            }
          />

          <Route path="/sales/:id" element={<SaleDetail />} />

          <Route
            path="/suppliers"
            element={
              <ProtectedRoute module="suppliers">
                <Suppliers />
              </ProtectedRoute>
            }
          />

          <Route 
            path="/accounts-payable"
            element={
              <ProtectedRoute module="accountPayable">
                <AccountsPayable />
              </ProtectedRoute>
            }
          />

          <Route
            path="/category"
            element={
              <ProtectedRoute module="category">
                <Categories />
              </ProtectedRoute>
            }
          />

          <Route
            path="/warehouses"
            element={
              <ProtectedRoute module="warehouse">
                <Warehouses />
              </ProtectedRoute>
            }
          />

          <Route 
            path="/reports/kardex"
            element={
              <ProtectedRoute module="reports">
                <Kardex />
              </ProtectedRoute>
            }
          />

          <Route 
            path="/reports/profit"
            element={
              <ProtectedRoute module="reports">
                <ProfitReport />
              </ProtectedRoute>
            }
          />

          <Route 
            path="/price-lists"
            element={
              <ProtectedRoute module="priceList">
                <PriceLists />
              </ProtectedRoute>
            }
          />

          <Route 
            path="/commissions"
            element={
              <ProtectedRoute module="commission">
                <Commissions />
              </ProtectedRoute>
            }
          />

          <Route path="/403" element={<Unauthorized />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}