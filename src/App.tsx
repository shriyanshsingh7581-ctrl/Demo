/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { CustomerWebsite } from './pages/CustomerWebsite';
import { AdminPartnerApp } from './pages/AdminPartnerApp';
import { ensureSeedDataInitialized } from './services/bookingStorage';

const RootOrAdminSwitch: React.FC = () => {
  const location = useLocation();
  const [hash, setHash] = useState(() => window.location.hash.toLowerCase());

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash.toLowerCase());
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const searchParams = new URLSearchParams(location.search);
  const portal = searchParams.get('portal')?.toLowerCase();
  const isAdminMode =
    portal === 'admin' ||
    searchParams.has('admin') ||
    hash === '#admin' ||
    hash === '#/admin' ||
    hash.startsWith('#/admin/');

  if (isAdminMode) {
    return <AdminPartnerApp />;
  }

  return <CustomerWebsite />;
};

export default function App() {
  useEffect(() => {
    ensureSeedDataInitialized();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootOrAdminSwitch />} />
        <Route path="/admin" element={<AdminPartnerApp />} />
        <Route path="/admin/calendar" element={<AdminPartnerApp />} />
        <Route path="/admin/job/:bookingId" element={<AdminPartnerApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
