import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { isAuthenticated } from "../features/auth/model/storage";

const AuthPage = lazy(() => import("../features/auth/pages/AuthPage"));
const ForgotPasswordPage = lazy(() => import("../features/auth/pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("../features/auth/pages/ResetPasswordPage"));
const HomePage = lazy(() => import("../features/home/pages/HomePage"));
const ProfilePage = lazy(() => import("../features/profile/pages/ProfilePage"));
const PurchasesPage = lazy(() => import("../features/purchases/pages/PurchasesPage"));
const HelpPage = lazy(() => import("../features/support/pages/HelpPage"));
const routerBasename = import.meta.env.BASE_URL === "/" ? undefined : import.meta.env.BASE_URL;

function RouteFallback() {
  return <main className="route-loading" aria-busy="true"><span className="spinner big" /><p>Carregando sua experiência…</p></main>;
}

/** Rota protegida: sem sessão → login. */
function RequireAuth({ children }: { children: React.ReactNode }) {
  return isAuthenticated() ? children : <Navigate to="/" replace />;
}

/** Rota pública de login: com sessão → vai direto à loja. */
function RedirectIfAuth({ children }: { children: React.ReactNode }) {
  return isAuthenticated() ? <Navigate to="/painel" replace /> : children;
}

export default function App() {
  return (
    <BrowserRouter basename={routerBasename}>
      <Suspense fallback={<RouteFallback />}><Routes>
        <Route
          path="/"
          element={
            <RedirectIfAuth>
              <AuthPage />
            </RedirectIfAuth>
          }
        />
        <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
        <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
        <Route
          path="/painel"
          element={
            <RequireAuth>
              <HomePage />
            </RequireAuth>
          }
        />
        <Route
          path="/compras"
          element={
            <RequireAuth>
              <PurchasesPage />
            </RequireAuth>
          }
        />
        <Route
          path="/perfil"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />
        <Route
          path="/ajuda"
          element={
            <RequireAuth>
              <HelpPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes></Suspense>
    </BrowserRouter>
  );
}
