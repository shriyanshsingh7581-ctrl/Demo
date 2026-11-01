/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { CustomerWebsite } from './pages/CustomerWebsite';
import { AdminPartnerApp } from './pages/AdminPartnerApp';
import { ensureSeedDataInitialized } from './services/bookingStorage';

const RouteSyncHandler: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash.toLowerCase();
    const searchParams = new URLSearchParams(location.search);
    const portal = searchParams.get('portal')?.toLowerCase();
    const isAdminQuery =
      portal === 'admin' ||
      searchParams.has('admin') ||
      hash === '#admin' ||
      hash === '#/admin';

    if (isAdminQuery && !location.pathname.startsWith('/admin')) {
      navigate('/admin', { replace: true });
    }
  }, [location, navigate]);

  return null;
};

export default function App() {
  useEffect(() => {
    ensureSeedDataInitialized();
  }, []);

  return (
    <BrowserRouter>
      <RouteSyncHandler />
      <Routes>
        <Route path="/" element={<CustomerWebsite />} />
        <Route path="/admin" element={<AdminPartnerApp />} />
        <Route path="/admin/calendar" element={<AdminPartnerApp />} />
        <Route path="/admin/job/:bookingId" element={<AdminPartnerApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
