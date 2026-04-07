import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { useAuthStore } from '@hooks/useAuth';
import { useI18n } from '@hooks/useI18n';
import ProtectedRoute from '@components/ProtectedRoute';
import AdminRoute from '@components/AdminRoute';
import Layout from '@components/Layout';
import LoginPage from '@pages/LoginPage';
import Dashboard from '@pages/Dashboard';
import LazyLoadingFallback from '@components/LazyLoadingFallback';
import {
  InventoryPage,
} from '@pages/index';

// Lazy load all other pages
const RollDetailPage = lazy(() => import('./pages/RollDetailPage'));
const RollMovementPage = lazy(() => import('./pages/RollMovementPage'));
const ChuteDetailPage = lazy(() => import('./pages/ChuteDetailPage'));
const ChuteMovementPage = lazy(() => import('./pages/ChuteMovementPage'));
const MovementsListPage = lazy(() => import('./pages/MovementsListPage'));
const SuppliersPage = lazy(() => import('./pages/SuppliersPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const AltierPage = lazy(() => import('./pages/AltierPage'));
const TransferBonsPage = lazy(() => import('./pages/TransferBonsPage'));
const PurchaseBonsPage = lazy(() => import('./pages/PurchaseBonsPage'));
const MaterialChuteThresholdsPage = lazy(() => import('./pages/MaterialChuteThresholdsPage'));
const ColorsPage = lazy(() => import('./pages/ColorsPage'));
const ClientsPage = lazy(() => import('./pages/ClientsPage'));
const CommandesListPage = lazy(() => import('./pages/CommandesListPage'));
const CommandeCreatePage = lazy(() => import('./pages/CommandeCreatePage'));
const CommandeEditPage = lazy(() => import('./pages/CommandeEditPage'));
const CommandeDetailPage = lazy(() => import('./pages/CommandeDetailPage'));
const CommandeReturnPage = lazy(() => import('./pages/CommandeReturnPage'));
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
                <Suspense fallback={<LazyLoadingFallback />}>
                  <RollDetailPage />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/roll/:rollId/movements"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={<LazyLoadingFallback />}>
                  <RollMovementPage />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/chute/:wasteId/movements"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={<LazyLoadingFallback />}>
                  <ChuteMovementPage />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/chute/:wasteId"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={<LazyLoadingFallback />}>
                  <ChuteDetailPage />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/movements"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={<LazyLoadingFallback />}>
                  <MovementsListPage />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/transfer-bons"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={<LazyLoadingFallback />}>
                  <TransferBonsPage />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/purchase-bons"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={<LazyLoadingFallback />}>
                  <PurchaseBonsPage />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />



        <Route
          path="/suppliers"
          element={
            <AdminRoute>
              <Layout>
                <Suspense fallback={<LazyLoadingFallback />}>
                  <SuppliersPage />
                </Suspense>
              </Layout>
            </AdminRoute>
          }
        />

        <Route
          path="/clients"
          element={
            <AdminRoute>
              <Layout>
                <Suspense fallback={<LazyLoadingFallback />}>
                  <ClientsPage />
                </Suspense>
              </Layout>
            </AdminRoute>
          }
        />

        <Route
          path="/commandes"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={<LazyLoadingFallback />}>
                  <CommandesListPage />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/commandes/create"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={<LazyLoadingFallback />}>
                  <CommandeCreatePage />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/commandes/:id/edit"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={<LazyLoadingFallback />}>
                  <CommandeEditPage />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/commandes/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={<LazyLoadingFallback />}>
                  <CommandeDetailPage />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/commandes/:id/returns"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={<LazyLoadingFallback />}>
                  <CommandeReturnPage />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/altiers"
          element={
            <AdminRoute>
              <Layout>
                <Suspense fallback={<LazyLoadingFallback />}>
                  <AltierPage />
                </Suspense>
              </Layout>
            </AdminRoute>
          }
        />

        <Route
          path="/users"
          element={
            <AdminRoute>
              <Layout>
                <Suspense fallback={<LazyLoadingFallback />}>
                  <UsersPage />
                </Suspense>
              </Layout>
            </AdminRoute>
          }
        />

        <Route
          path="/material-thresholds"
          element={
            <AdminRoute>
              <Layout>
                <Suspense fallback={<LazyLoadingFallback />}>
                  <MaterialChuteThresholdsPage />
                </Suspense>
              </Layout>
            </AdminRoute>
          }
        />

        <Route
          path="/colors"
          element={
            <AdminRoute>
              <Layout>
                <Suspense fallback={<LazyLoadingFallback />}>
                  <ColorsPage />
                </Suspense>
              </Layout>
            </AdminRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={<LazyLoadingFallback />}>
                  <ReportsPage />
                </Suspense>
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
