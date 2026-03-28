import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '@hooks/useAuth';
import { useI18n } from '@hooks/useI18n';
import ProtectedRoute from '@components/ProtectedRoute';
import AdminRoute from '@components/AdminRoute';
import Layout from '@components/Layout';
import LoginPage from '@pages/LoginPage';
import Dashboard from '@pages/Dashboard';
import {
  InventoryPage,
  RollDetailPage,
  RollMovementPage,
  MovementsListPage,
  SuppliersPage,
  UsersPage,
  ReportsPage,
  AltierPage,
  TransferBonsPage,
  MaterialChuteThresholdsPage,
  ClientsPage,
  CommandesListPage,
  CommandeCreatePage,
  CommandeDetailPage,
} from '@pages/index';
import './App.css';

export function App() {
  const { checkAuth } = useAuthStore();
  const { i18n } = useI18n();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Handle RTL for Arabic
  useEffect(() => {
    const html = document.documentElement;
    html.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    html.lang = i18n.language;
  }, [i18n.language]);

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <Layout>
                <InventoryPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/roll/:rollId"
          element={
            <ProtectedRoute>
              <Layout>
                <RollDetailPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/roll/:rollId/movements"
          element={
            <ProtectedRoute>
              <Layout>
                <RollMovementPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/movements"
          element={
            <ProtectedRoute>
              <Layout>
                <MovementsListPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/transfer-bons"
          element={
            <ProtectedRoute>
              <Layout>
                <TransferBonsPage />
              </Layout>
            </ProtectedRoute>
          }
        />



        <Route
          path="/suppliers"
          element={
            <AdminRoute>
              <Layout>
                <SuppliersPage />
              </Layout>
            </AdminRoute>
          }
        />

        <Route
          path="/clients"
          element={
            <AdminRoute>
              <Layout>
                <ClientsPage />
              </Layout>
            </AdminRoute>
          }
        />

        <Route
          path="/commandes"
          element={
            <ProtectedRoute>
              <Layout>
                <CommandesListPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/commandes/create"
          element={
            <ProtectedRoute>
              <Layout>
                <CommandeCreatePage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/commandes/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <CommandeDetailPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/altiers"
          element={
            <AdminRoute>
              <Layout>
                <AltierPage />
              </Layout>
            </AdminRoute>
          }
        />

        <Route
          path="/users"
          element={
            <AdminRoute>
              <Layout>
                <UsersPage />
              </Layout>
            </AdminRoute>
          }
        />

        <Route
          path="/material-thresholds"
          element={
            <AdminRoute>
              <Layout>
                <MaterialChuteThresholdsPage />
              </Layout>
            </AdminRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Layout>
                <ReportsPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
