import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { FileSpreadsheet, Upload, Send } from 'lucide-react';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const isUploadPage = location.pathname === '/';
  const isPaymentPage = location.pathname === '/pagamentos';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm safe-area-inset-top">
        <div className="px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-gray-100 gap-2">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <div className="bg-green-100 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
              <FileSpreadsheet className="text-green-600 h-5 sm:h-6 w-5 sm:w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-semibold text-gray-900 truncate">Portal de Pagamentos</h1>
              <p className="text-xs sm:text-sm text-gray-500 truncate">WhatsApp Payments</p>
            </div>
          </div>
        </div>
        
        <nav className="flex px-3 sm:px-6 gap-0 overflow-x-auto">
          <button
            onClick={() => navigate('/')}
            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-3 font-medium text-xs sm:text-sm transition-colors border-b-2 whitespace-nowrap ${
              isUploadPage
                ? 'border-green-600 text-green-600 bg-green-50'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Upload className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Lançamento de Planilha</span>
            <span className="sm:hidden">Upload</span>
          </button>
          
          <button
            onClick={() => navigate('/pagamentos')}
            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-3 font-medium text-xs sm:text-sm transition-colors border-b-2 whitespace-nowrap ${
              isPaymentPage
                ? 'border-green-600 text-green-600 bg-green-50'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Send className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Pagamentos</span>
            <span className="sm:hidden">Pagar</span>
          </button>
        </nav>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-4 sm:gap-6 safe-area-inset-bottom">
        <Outlet />
      </main>
    </div>
  );
}
