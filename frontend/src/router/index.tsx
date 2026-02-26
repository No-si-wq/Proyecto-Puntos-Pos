import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import AuthLayout from "../layouts/AuthLayout";

import ProtectedRoute from "../auth/ProtectedRoute";

import Login from "../pages/auth/Login";
import Dashboard from "../pages/dashboard/Dashboard";
import Users from "../pages/users/Users";
import Customers from "../pages/customers/Customers";
import Products from "../pages/products/Products";
import Purchases from "../pages/purchases/Purchases";
import Sales from "../pages/sales/Sales";
import Suppliers from "../pages/suppliers/Suppliers";
import PurchaseLotsReportPage from "../pages/reports/PurchaseLotsReportPage";
import Categories from "../pages/categories/Categories";
import PurchaseHistory from "../pages/purchases/PurchaseHistory";
import SaleHistory from "../pages/sales/SaleHistory";
import InventoryPage from "../pages/inventory/Inventory";
import InventoryList from "../pages/inventory/InventroyList";
import Warehouses from "../pages/warehouses/warehouses";
import AdminDashboard from "../pages/dashboard/AdminDashboard";
import AccountsReceivable from "../pages/accounts/AccountsReceivable";
import AccountsPayable from "../pages/accounts/AccountsPayable";

import Unauthorized from "../pages/Unauthorized";

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

          <Route path="/403" element={<Unauthorized />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}