import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { AppShell } from '@/components/layout/AppShell';
import { AdminRoute, ProtectedRoute } from '@/components/common/ProtectedRoute';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAppBootstrap } from '@/hooks/useAppBootstrap';
import { useThemeEffect } from '@/hooks/useThemeEffect';

const HomePage = lazy(async () => ({
  default: (await import('@/pages/HomePage')).HomePage,
}));
const ShopPage = lazy(async () => ({
  default: (await import('@/pages/ShopPage')).ShopPage,
}));
const ProductPage = lazy(async () => ({
  default: (await import('@/pages/ProductPage')).ProductPage,
}));
const CartPage = lazy(async () => ({
  default: (await import('@/pages/CartPage')).CartPage,
}));
const CheckoutPage = lazy(async () => ({
  default: (await import('@/pages/CheckoutPage')).CheckoutPage,
}));
const CheckoutSuccessPage = lazy(async () => ({
  default: (await import('@/pages/CheckoutSuccessPage')).CheckoutSuccessPage,
}));
const LoginPage = lazy(async () => ({
  default: (await import('@/pages/LoginPage')).LoginPage,
}));
const RegisterPage = lazy(async () => ({
  default: (await import('@/pages/RegisterPage')).RegisterPage,
}));
const ForgotPasswordPage = lazy(async () => ({
  default: (await import('@/pages/ForgotPasswordPage')).ForgotPasswordPage,
}));
const ResetPasswordPage = lazy(async () => ({
  default: (await import('@/pages/ResetPasswordPage')).ResetPasswordPage,
}));
const VerifyEmailPage = lazy(async () => ({
  default: (await import('@/pages/VerifyEmailPage')).VerifyEmailPage,
}));
const ProfilePage = lazy(async () => ({
  default: (await import('@/pages/ProfilePage')).ProfilePage,
}));
const AdminDashboardPage = lazy(async () => ({
  default: (await import('@/pages/Admin/AdminDashboardPage')).AdminDashboardPage,
}));
const AdminProductsPage = lazy(async () => ({
  default: (await import('@/pages/Admin/AdminProductsPage')).AdminProductsPage,
}));
const AdminOrdersPage = lazy(async () => ({
  default: (await import('@/pages/Admin/AdminOrdersPage')).AdminOrdersPage,
}));
const AdminUsersPage = lazy(async () => ({
  default: (await import('@/pages/Admin/AdminUsersPage')).AdminUsersPage,
}));
const NotFoundPage = lazy(async () => ({
  default: (await import('@/pages/NotFoundPage')).NotFoundPage,
}));

const routeFallback = (
  <div className="page-shell">
    <Skeleton className="h-[60vh] rounded-card" />
  </div>
);

function App() {
  useAppBootstrap();
  useThemeEffect();

  return (
    <ErrorBoundary>
      <Suspense fallback={routeFallback}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/products/:id" element={<ProductPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            <Route path="/verify-email/:token" element={<VerifyEmailPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/products" element={<AdminProductsPage />} />
              <Route path="/admin/orders" element={<AdminOrdersPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
