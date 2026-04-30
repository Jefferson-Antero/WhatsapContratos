/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import UploadPage from './pages/UploadPage';
import PaymentPage from './pages/PaymentPage';
import { PaymentRecord } from './types';

function AppContent() {
  const [records, setRecords] = useState<PaymentRecord[]>([]);

  // Carregar records do localStorage ao montar
  useEffect(() => {
    const savedRecords = localStorage.getItem('payment_records');
    if (savedRecords) {
      try {
        setRecords(JSON.parse(savedRecords));
      } catch (e) {
        console.error('Erro ao carregar records:', e);
      }
    }
  }, []);

  // Salvar records no localStorage quando mudar
  const handleSetRecords = (newRecords: PaymentRecord[]) => {
    setRecords(newRecords);
    localStorage.setItem('payment_records', JSON.stringify(newRecords));
  };

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<UploadPage setRecords={handleSetRecords} />} />
        <Route path="/pagamentos" element={<PaymentPage records={records} setRecords={handleSetRecords} />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
