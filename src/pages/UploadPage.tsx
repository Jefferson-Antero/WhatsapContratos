import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, ArrowRight } from 'lucide-react';
import { PaymentRecord } from '../types';
import { cn } from '../lib/utils';
import { parseSpreadsheetFromBuffer } from '../lib/spreadsheetParser';

interface UploadPageProps {
  setRecords: React.Dispatch<React.SetStateAction<PaymentRecord[]>>;
}

export default function UploadPage({ setRecords }: UploadPageProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [existingFile, setExistingFile] = useState<{ fileName: string; size: number; uploadedAt: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkExistingFile();
  }, []);

  const checkExistingFile = async () => {
    try {
      setIsChecking(true);
      const res = await fetch('/api/check-upload');
      const data = await res.json();
      if (data.exists) {
        setExistingFile(data);
      } else {
        setExistingFile(null);
      }
    } catch {
      setExistingFile(null);
    } finally {
      setIsChecking(false);
    }
  };

  const processFile = async (file: File) => {
    try {
      setIsLoading(true);
      setError(null);

      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const arrayBuffer = evt.target?.result as ArrayBuffer;
          const parsedRecords = await parseSpreadsheetFromBuffer(arrayBuffer);

          if (parsedRecords.length === 0) {
            setError('Nenhum registro encontrado. Verifique se a planilha possui as colunas: Contrato, Processo, Período, Valor.');
            setIsLoading(false);
            return;
          }

          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/octet-stream' },
            body: new Uint8Array(arrayBuffer),
          });

          if (!uploadResponse.ok) throw new Error('Erro ao fazer upload do arquivo');

          setRecords(parsedRecords);
          if (fileInputRef.current) fileInputRef.current.value = '';
          navigate('/pagamentos');
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Erro ao processar arquivo');
          setIsLoading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar arquivo');
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>) => {
    let file: File | undefined;
    if ('dataTransfer' in e) {
      e.preventDefault();
      file = e.dataTransfer.files?.[0];
      setIsHovering(false);
    } else {
      file = e.target.files?.[0];
    }
    if (!file) return;
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setError('Por favor, selecione um arquivo Excel (.xlsx, .xls) ou CSV');
      return;
    }
    processFile(file);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (isChecking) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-green-200 border-t-green-600" />
      </div>
    );
  }

  if (existingFile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6">
        <div className="w-full max-w-2xl bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="bg-blue-50 p-3 rounded-lg flex-shrink-0">
              <FileText className="h-7 w-7 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Planilha carregada</h2>
              <p className="text-sm text-gray-500 truncate">{existingFile.fileName}</p>
              <p className="text-xs text-gray-400 mt-1">{formatFileSize(existingFile.size)}</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/pagamentos')}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm"
          >
            <ArrowRight className="h-5 w-5" />
            Continuar para Pagamentos
          </button>

          <p className="text-xs text-gray-400 text-center mt-4">
            Para trocar a planilha, use a lixeira na tela de Pagamentos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6">
      <div
        className={cn(
          "w-full max-w-2xl border-2 border-dashed rounded-xl transition-all duration-200 bg-white p-6 sm:p-12 text-center",
          isHovering ? "border-green-400 bg-green-50" : "border-gray-300 hover:border-gray-400"
        )}
        style={{ minHeight: 'clamp(300px, 50vh, 60vh)' }}
        onDragOver={(e) => { e.preventDefault(); setIsHovering(true); }}
        onDragLeave={() => setIsHovering(false)}
        onDrop={handleFileUpload}
      >
        <div className="flex flex-col items-center justify-center h-full gap-4 sm:gap-6">
          <div className="bg-green-50 p-3 sm:p-4 rounded-full">
            <Upload className="h-6 sm:h-8 w-6 sm:w-8 text-green-600" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1">Upload da Planilha</h3>
            <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
              Arraste e solte o arquivo Excel (.xlsx, .xls) aqui ou clique para selecionar.
              Colunas: Contrato, Processo, Período/Valor, Setor/Data.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm px-4 py-2 rounded-lg w-full max-w-md">
              {error}
            </div>
          )}

          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
            disabled={isLoading}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className={cn(
              "bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium text-sm sm:text-base transition-colors shadow-sm",
              isLoading && "opacity-50 cursor-not-allowed"
            )}
          >
            {isLoading ? "Processando..." : "Selecionar Arquivo"}
          </button>
        </div>
      </div>
    </div>
  );
}
