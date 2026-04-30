import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Trash2, Edit2, FileText } from 'lucide-react';
import { PaymentRecord } from '../types';
import { cn } from '../lib/utils';
import { parseSpreadsheetFromBuffer } from '../lib/spreadsheetParser';

interface UploadPageProps {
  setRecords: React.Dispatch<React.SetStateAction<PaymentRecord[]>>;
}

interface UploadedFile {
  exists: boolean;
  fileName?: string;
  size?: number;
  uploadedAt?: string;
}

export default function UploadPage({ setRecords }: UploadPageProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Verificar se existe arquivo no servidor ao carregar
  useEffect(() => {
    checkUploadedFile();
  }, []);

  const checkUploadedFile = async () => {
    try {
      const response = await fetch('/api/check-upload');
      const data = await response.json();
      setUploadedFile(data);
      setError(null);
    } catch (err) {
      console.error('Erro ao verificar arquivo:', err);
      setError('Erro ao verificar arquivo salvo');
    }
  };

  const processFile = async (file: File) => {
    try {
      setIsLoading(true);
      setError(null);

      // Ler o arquivo
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const arrayBuffer = evt.target?.result as ArrayBuffer;
          
          // Usar o parser centralizado
          const parsedRecords = await parseSpreadsheetFromBuffer(arrayBuffer);

          // Enviar arquivo para o servidor
          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/octet-stream',
            },
            body: new Uint8Array(arrayBuffer),
          });

          if (!uploadResponse.ok) {
            throw new Error('Erro ao fazer upload do arquivo');
          }

          setRecords(parsedRecords);
          await checkUploadedFile();

          if (fileInputRef.current) fileInputRef.current.value = '';

          navigate('/pagamentos');
        } catch (err) {
          console.error('Erro ao processar arquivo:', err);
          setError(err instanceof Error ? err.message : 'Erro ao processar arquivo');
          setIsLoading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error('Erro:', err);
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

  const handleRemoveFile = async () => {
    if (!uploadedFile?.fileName) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/upload/${uploadedFile.fileName}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao deletar arquivo');
      }

      await checkUploadedFile();
      setRecords([]);
    } catch (err) {
      console.error('Erro ao remover arquivo:', err);
      setError(err instanceof Error ? err.message : 'Erro ao remover arquivo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeFile = () => {
    // Limpar arquivo atual e permitir novo upload
    handleRemoveFile().then(() => {
      fileInputRef.current?.click();
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6">
      {uploadedFile?.exists ? (
        // Arquivo já existe
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-8">
            <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="bg-blue-50 p-2 sm:p-3 rounded-lg flex-shrink-0">
                <FileText className="h-6 sm:h-8 w-6 sm:w-8 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 break-words">
                  Arquivo Salvo
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mb-2 truncate">
                  {uploadedFile.fileName}
                </p>
                <div className="flex flex-col gap-1 text-xs text-gray-500">
                  <p>Tamanho: {formatFileSize(uploadedFile.size)}</p>
                  <p className="truncate">Enviado em: {formatDate(uploadedFile.uploadedAt)}</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <p className="text-xs sm:text-sm text-blue-900">
                ℹ️ Você pode remover este arquivo para adicionar uma nova planilha, ou alterar para escolher um arquivo diferente.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => navigate('/pagamentos')}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium text-sm sm:text-base transition-colors shadow-sm"
              >
                Prosseguir
              </button>
              <button
                onClick={handleChangeFile}
                disabled={isLoading}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium text-sm sm:text-base transition-colors shadow-sm disabled:opacity-50"
              >
                <Edit2 className="h-4 w-4" />
                <span className="hidden sm:inline">Alterar</span>
              </button>
              <button
                onClick={handleRemoveFile}
                disabled={isLoading}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium text-sm sm:text-base transition-colors shadow-sm disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Remover</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Nenhum arquivo - mostrar área de upload
        <div
          className={cn(
            "w-full max-w-2xl border-2 border-dashed rounded-lg sm:rounded-xl transition-all duration-200 bg-white p-6 sm:p-12 text-center",
            isHovering ? "border-green-400 bg-green-50" : "border-gray-300 hover:border-gray-400"
          )}
          style={{ minHeight: 'clamp(300px, 50vh, 60vh)' }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsHovering(true);
          }}
          onDragLeave={() => setIsHovering(false)}
          onDrop={handleFileUpload}
        >
          <div className="bg-green-50 p-3 sm:p-4 rounded-full mb-3 sm:mb-4 w-fit mx-auto">
            <Upload className="h-6 sm:h-8 w-6 sm:w-8 text-green-600" />
          </div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1">
            Upload da Planilha
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto mb-4 sm:mb-6">
            Arraste e solte o arquivo Excel (.xlsx, .xls) aqui ou clique para selecionar. Colunas: Contrato, Processo, Período/Valor, Setor/Data.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-lg mb-4 sm:mb-6">
              {error}
            </div>
          )}

          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
            disabled={isLoading}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className={cn(
              "bg-green-600 hover:bg-green-700 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium text-sm sm:text-base transition-colors shadow-sm",
              isLoading && "opacity-50 cursor-not-allowed"
            )}
          >
            {isLoading ? "Processando..." : "Selecionar Arquivo"}
          </button>
        </div>
      )}
    </div>
  );
}

