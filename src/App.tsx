/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CustomerWebsite } from './pages/CustomerWebsite';
import { AdminPartnerApp } from './pages/AdminPartnerApp';
import { ensureSeedDataInitialized } from './services/bookingStorage';

export default function App() {
  useEffect(() => {
    ensureSeedDataInitialized();
  }, []);

  return (
    <BrowserRouter>
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
