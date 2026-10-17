import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { PlayerTournamentPage } from './pages/PlayerTournamentPage';
import { AdminTournamentPage } from './pages/AdminTournamentPage';
import { TvBroadcastPage } from './pages/TvBroadcastPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/tournament/:id" element={<PlayerTournamentPage />} />
        <Route path="/tournament/:id/tv" element={<TvBroadcastPage />} />
        <Route path="/admin/tournament/:id" element={<AdminTournamentPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
