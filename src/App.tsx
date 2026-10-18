import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { HomePage } from './pages/HomePage';
import { AuthProvider } from './contexts/AuthContext';
import { AdminRoute } from './components/AdminRoute';

// Code-split secondary pages so visitors only download what they open
// (admin page code is never fetched by non-admin users).
const PlayerTournamentPage = lazy(() =>
  import('./pages/PlayerTournamentPage').then((m) => ({ default: m.PlayerTournamentPage })),
);
const AdminTournamentPage = lazy(() =>
  import('./pages/AdminTournamentPage').then((m) => ({ default: m.AdminTournamentPage })),
);
const TvBroadcastPage = lazy(() =>
  import('./pages/TvBroadcastPage').then((m) => ({ default: m.TvBroadcastPage })),
);
const LoginPage = lazy(() =>
  import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })),
);

const PageLoader: React.FC = () => (
  <div className="min-h-screen bg-[#06080d] flex items-center justify-center">
    <div className="w-10 h-10 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
  </div>
);

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/tournament/:id" element={<PlayerTournamentPage />} />
            <Route path="/tournament/:id/tv" element={<TvBroadcastPage />} />
            <Route
              path="/admin/tournament/:id"
              element={
                <AdminRoute>
                  <AdminTournamentPage />
                </AdminRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        <Analytics />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
