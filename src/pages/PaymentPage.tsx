import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, CheckSquare, Square, Trash2, Eye, EyeOff, FileSpreadsheet, Share2, BookUser } from 'lucide-react';
import { PaymentRecord } from '../types';
import { cn } from '../lib/utils';
import { fetchAndParseSpreadsheet } from '../lib/spreadsheetParser';
import { registerSentPayment, fetchPaymentRecords, fetchSentPaymentIds } from '../lib/paymentService';

interface PaymentPageProps {
  records: PaymentRecord[];
  setRecords: React.Dispatch<React.SetStateAction<PaymentRecord[]>>;
}

export default function PaymentPage({ records, setRecords }: PaymentPageProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [phoneNumber, setPhoneNumber] = useState('');
  const [savePhone, setSavePhone] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSyncingPayments, setIsSyncingPayments] = useState(false);
  const navigate = useNavigate();

  const contactsSupported = typeof (navigator as any).contacts !== 'undefined';

  // Copia texto para clipboard com fallback para HTTP (sem HTTPS)
  const copyToClipboard = async (text: string): Promise<boolean> => {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // cai no fallback abaixo
      }
    }
    // Fallback via execCommand — funciona em HTTP
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.cssText = 'position:fixed;opacity:0;pointer-events:none;';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  };

  const pickContact = async () => {
    try {
      const contacts = await (navigator as any).contacts.select(['name', 'tel'], { multiple: false });
      if (!contacts || contacts.length === 0) return;
      const tel: string = contacts[0]?.tel?.[0] ?? '';
      if (!tel) { alert('Contato sem número de telefone.'); return; }
      // Remove tudo que não for dígito e descarta o +55 se vier
      const digits = tel.replace(/\D/g, '').replace(/^55/, '');
      setPhoneNumber(digits);
    } catch {
      alert('Não foi possível acessar os contatos.');
    }
  };

  // Carregar dados ao montar — telefone em sessionStorage (limpa ao fechar o browser)
  useEffect(() => {
    const savedPhone = sessionStorage.getItem('whatsapp_phone') || '';
    const savedSavePhone = sessionStorage.getItem('whatsapp_save_phone') === 'true';
    const savedSentIds = localStorage.getItem('sent_payment_ids');

    setPhoneNumber(savedPhone);
    setSavePhone(savedSavePhone);

    if (savedSentIds) {
      try {
        const sentIdArray = JSON.parse(savedSentIds);
        setSentIds(new Set(sentIdArray));
      } catch (e) {
        console.error('Erro ao carregar sentIds:', e);
      }
    }
  }, []);

  // Carregar planilha do servidor se não houver dados locais
  useEffect(() => {
    const loadSpreadsheetFromServer = async () => {
      // Evitar múltiplas requisições
      if (hasAttemptedLoad) return;
      
      // Verificar se já há dados no localStorage ou no state
      const savedRecords = localStorage.getItem('payment_records');
      
      if (records.length === 0 && !savedRecords) {
        setIsLoading(true);
        setLoadError(null);
        
        try {
          const serverRecords = await fetchAndParseSpreadsheet();
          
          if (serverRecords && serverRecords.length > 0) {
            // Carregar registros do servidor
            setRecords(serverRecords);
            localStorage.setItem('payment_records', JSON.stringify(serverRecords));
          } else {
            setLoadError('Nenhuma planilha foi encontrada no servidor.');
          }
        } catch (error) {
          console.error('Erro ao carregar planilha do servidor:', error);
          setLoadError('Erro ao buscar a planilha do servidor. Tente novamente mais tarde.');
        } finally {
          setIsLoading(false);
          setHasAttemptedLoad(true);
        }
      } else if (savedRecords && records.length === 0) {
        // Se há dados salvos mas não estão no state, carregar do localStorage
        try {
          const parsedRecords = JSON.parse(savedRecords);
          setRecords(parsedRecords);
          setHasAttemptedLoad(true);
        } catch (e) {
          console.error('Erro ao carregar dados do localStorage:', e);
          setHasAttemptedLoad(true);
        }
      } else {
        setHasAttemptedLoad(true);
      }
    };

    loadSpreadsheetFromServer();
  }, [records.length, setRecords, hasAttemptedLoad]);

  // Salvar sentIds no localStorage quando mudar
  useEffect(() => {
    const sentArray = Array.from(sentIds);
    localStorage.setItem('sent_payment_ids', JSON.stringify(sentArray));
  }, [sentIds]);

  // Verificar se há registros após carregamento
  useEffect(() => {
    if (hasAttemptedLoad && records.length === 0 && loadError === null) {
      // Sem dados e sem erro, redirecionar para upload
      navigate('/');
    }
  }, [records.length, hasAttemptedLoad, loadError, navigate]);

  // Sincronizar pagamentos do backend após carregar dados
  useEffect(() => {
    const syncPaymentsFromBackend = async () => {
      if (!hasAttemptedLoad || records.length === 0) return;

      // Evitar sincronização repetida
      if (isSyncingPayments) return;

      setIsSyncingPayments(true);
      try {
        const backendSentIds = await fetchSentPaymentIds();
        
        if (backendSentIds.size > 0) {
          // Mesclar com os IDs locais
          const mergedSentIds = new Set([...sentIds, ...backendSentIds]);
          setSentIds(mergedSentIds);
          
          // Atualizar localStorage
          localStorage.setItem('sent_payment_ids', JSON.stringify(Array.from(mergedSentIds)));
        }
      } catch (error) {
        console.error('Erro ao sincronizar pagamentos do backend:', error);
        // Continuar funcionando sem sincronizar
      } finally {
        setIsSyncingPayments(false);
      }
    };

    syncPaymentsFromBackend();
  }, [hasAttemptedLoad, records.length]);

  const toggleSelection = (id: string) => {
    // Verificar se já foi notificado
    if (sentIds.has(id)) {
      alert('⚠️ Notificação já enviada para este contrato!');
      return;
    }

    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    // Criar set apenas com IDs que não foram enviados
    const unsentRecords = records.filter(r => !sentIds.has(r.id));
    
    if (selectedIds.size === unsentRecords.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(unsentRecords.map(r => r.id)));
    }
  };

  const formatPhoneNumber = (val: string) => {
    return val.replace(/\D/g, '');
  };

  const clearData = () => {
    setRecords([]);
    setSelectedIds(new Set());
    setSentIds(new Set());
    localStorage.removeItem('sent_payment_ids');
    navigate('/');
  };

  const sendWhatsAppMsg = () => {
    if (selectedIds.size === 0) {
      alert("Selecione pelo menos uma linha para enviar.");
      return;
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (!formattedPhone || formattedPhone.length < 10) {
      alert("Por favor, insira um número de telefone válido (com DDD).");
      return;
    }

    // Salvar número em sessionStorage (dura apenas enquanto o browser estiver aberto)
    if (savePhone) {
      sessionStorage.setItem('whatsapp_phone', phoneNumber);
      sessionStorage.setItem('whatsapp_save_phone', 'true');
    } else {
      sessionStorage.removeItem('whatsapp_phone');
      sessionStorage.removeItem('whatsapp_save_phone');
    }

    const selectedRecords = records.filter(r => selectedIds.has(r.id));

    let text = `Olá, por favor providencie o pagamento dos seguintes contratos/processos:\n\n`;
    selectedRecords.forEach(r => {
      if (r.processo !== '-') text += `*PROCESSO:* ${r.processo}\n`;
      if (r.contratoObjeto !== '-') text += `*CONTRATO / CREDOR / OBJETO:* ${r.contratoObjeto}\n`;
      if (r.periodoValor !== '-') text += `*PERÍODO / VALOR:* ${r.periodoValor}\n`;
      text += `--------------------------\n`;
    });

    const encodedText = encodeURIComponent(text);
    const whatsappUrl = `https://wa.me/55${formattedPhone}?text=${encodedText}`;

    // Marcar os IDs como enviados
    const newSentIds = new Set(sentIds);
    selectedIds.forEach(id => newSentIds.add(id));
    setSentIds(newSentIds);

    // Desselecionar os IDs
    setSelectedIds(new Set());

    // Abrir WhatsApp
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

    // Registrar pagamentos no backend de forma assíncrona
    registerPaymentsToBackend(selectedRecords, formattedPhone);
  };

  // Registrar pagamentos no backend
  const registerPaymentsToBackend = async (selectedRecords: PaymentRecord[], phoneNumber: string) => {
    for (const record of selectedRecords) {
      try {
        await registerSentPayment(record.id, record, phoneNumber);
      } catch (error) {
        // Log silencioso de erros - não interromper a experiência do usuário
        console.warn(`Erro ao registrar pagamento ${record.id} no servidor:`, error);
      }
    }
  };

  const shareSelectedRecords = async () => {
    if (selectedIds.size === 0) {
      alert("Selecione pelo menos uma linha para compartilhar.");
      return;
    }

    const selectedRecords = records.filter(r => selectedIds.has(r.id));

    let text = `Olá, por favor providencie o pagamento dos seguintes contratos/processos:\n\n`;
    selectedRecords.forEach(r => {
      if (r.processo !== '-') text += `PROCESSO: ${r.processo}\n`;
      if (r.contratoObjeto !== '-') text += `CONTRATO / CREDOR / OBJETO: ${r.contratoObjeto}\n`;
      if (r.valor !== '-') text += `VALOR: ${r.valor}\n`;
      if (r.periodo !== '-') text += `PERÍODO: ${r.periodo}\n`;
      text += `---\n`;
    });

    // Verificar se a Web Share API está disponível
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Solicitação de Pagamento',
          text: text,
        });

        // Marcar os IDs como enviados
        const newSentIds = new Set(sentIds);
        selectedIds.forEach(id => newSentIds.add(id));
        setSentIds(newSentIds);

        // Desselecionar os IDs
        setSelectedIds(new Set());

        // Registrar pagamentos no backend
        registerPaymentsToBackend(selectedRecords, '');
      } catch (error) {
        // Usuário cancelou o compartilhamento
        console.log('Compartilhamento cancelado:', error);
      }
    } else {
      // Fallback: copiar para clipboard
      const copied = await copyToClipboard(text);
      if (copied) {
        alert('Conteúdo copiado! Cole em qualquer aplicativo para compartilhar.');

        const newSentIds = new Set(sentIds);
        selectedIds.forEach(id => newSentIds.add(id));
        setSentIds(newSentIds);
        setSelectedIds(new Set());
        registerPaymentsToBackend(selectedRecords, '');
      } else {
        alert('Erro ao copiar o conteúdo. Tente usar o botão Compartilhar.');
      }
    }
  };

  return (
    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden flex-1 min-h-[400px] sm:min-h-[500px]">
      {isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600 mb-4"></div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
            Carregando dados...
          </h3>
          <p className="text-xs sm:text-sm text-gray-500">
            Buscando a planilha do servidor
          </p>
        </div>
      )}
      {!isLoading && loadError && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 text-center">
          <div className="bg-red-50 p-3 sm:p-4 rounded-full mb-3 sm:mb-4 w-fit mx-auto">
            <FileSpreadsheet className="h-6 sm:h-8 w-6 sm:w-8 text-red-600" />
          </div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
            Erro ao carregar planilha
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6 max-w-md">
            {loadError}
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-green-600 hover:bg-green-700 text-white px-5 sm:px-6 py-2 sm:py-2.5 rounded-lg font-medium text-sm sm:text-base transition-colors shadow-sm"
          >
            Fazer upload de planilha
          </button>
        </div>
      )}
      {!isLoading && records.length === 0 && !loadError ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 text-center">
          <div className="bg-blue-50 p-3 sm:p-4 rounded-full mb-3 sm:mb-4 w-fit mx-auto">
            <FileSpreadsheet className="h-6 sm:h-8 w-6 sm:w-8 text-blue-600" />
          </div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
            Nenhuma planilha carregada
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6 max-w-md">
            Volte para a aba "Upload" para fazer upload de uma planilha de pagamentos.
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-green-600 hover:bg-green-700 text-white px-5 sm:px-6 py-2 sm:py-2.5 rounded-lg font-medium text-sm sm:text-base transition-colors shadow-sm"
          >
            Ir para Upload
          </button>
        </div>
      ) : !isLoading && records.length > 0 ? (
        <>
          <div className="bg-gray-50 px-3 sm:px-5 py-3 border-b border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-white border border-gray-200 text-gray-700 text-xs sm:text-sm font-medium px-2 sm:px-2.5 py-1 rounded-md">
                {records.length}
              </span>
              {selectedIds.size > 0 && (
                <span className="bg-green-100 text-green-700 text-xs sm:text-sm font-medium px-2 sm:px-2.5 py-1 rounded-md">
                  {selectedIds.size} selecionados
                </span>
              )}
              {sentIds.size > 0 && (
                <span className="bg-emerald-100 text-emerald-700 text-xs sm:text-sm font-medium px-2 sm:px-2.5 py-1 rounded-md">
                  {sentIds.size} enviados
                </span>
              )}
            </div>
            <button 
              onClick={clearData}
              className="flex items-center space-x-2 text-xs sm:text-sm text-red-600 hover:text-red-700 font-medium px-2 sm:px-3 py-1.5 rounded-md hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Limpar</span>
            </button>
          </div>
          
          <div className="overflow-auto flex-1 p-0">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="bg-white sticky top-0 z-10 shadow-[0_1px_0_0_#e5e7eb]">
                <tr>
                  <th className="px-2 sm:px-5 py-3 sm:py-4 w-10 sm:w-16">
                    <button 
                      onClick={toggleAll}
                      className="text-gray-400 hover:text-green-600 transition-colors flex items-center justify-center p-1"
                      title="Selecionar/Desselecionar todos não notificados"
                      type="button"
                    >
                      {(() => {
                        const unsentRecords = records.filter(r => !sentIds.has(r.id));
                        return selectedIds.size === unsentRecords.length && unsentRecords.length > 0 ? (
                          <CheckSquare className="h-4 sm:h-5 w-4 sm:w-5 text-green-600" />
                        ) : (
                          <Square className="h-4 sm:h-5 w-4 sm:w-5" />
                        );
                      })()}
                    </button>
                  </th>
                  <th className="px-2 sm:px-4 py-3 sm:py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contrato / Credor</th>
                  <th className="px-2 sm:px-4 py-3 sm:py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Processo</th>
                  <th className="hidden sm:table-cell px-2 sm:px-4 py-3 sm:py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Período</th>
                  <th className="px-2 sm:px-4 py-3 sm:py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Valor</th>
                  <th className="px-2 sm:px-4 py-3 sm:py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="hidden lg:table-cell px-2 sm:px-4 py-3 sm:py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Setor / Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {records.map((record, i) => {
                  const isSelected = selectedIds.has(record.id);
                  const isSent = sentIds.has(record.id);
                  return (
                    <tr 
                      key={record.id}
                      onClick={() => !isSent && toggleSelection(record.id)}
                      className={cn(
                        "transition-colors group border-b border-gray-100",
                        isSent 
                          ? "bg-emerald-100 text-emerald-900 cursor-not-allowed" 
                          : "cursor-pointer",
                        isSent
                          ? "bg-emerald-100 hover:bg-emerald-100"
                          : isSelected 
                            ? "bg-green-50 hover:bg-green-100" 
                            : "hover:bg-gray-50",
                        !isSent && i % 2 === 0 && !isSelected ? "bg-white" : ""
                      )}
                    >
                      <td className="px-2 sm:px-5 py-2 sm:py-3 whitespace-nowrap">
                        <div className={cn(
                          "flex items-center justify-center p-1 rounded",
                          isSent 
                            ? "text-emerald-700" 
                            : isSelected 
                              ? "text-green-600" 
                              : "text-gray-300 group-hover:text-gray-400"
                        )}>
                          {isSent || isSelected ? <CheckSquare className="h-4 sm:h-5 w-4 sm:w-5" /> : <Square className="h-4 sm:h-5 w-4 sm:w-5" />}
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm truncate font-medium">{record.contratoObjeto}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm truncate font-semibold text-blue-600">{record.processo}</td>
                      <td className="hidden sm:table-cell px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm truncate">{record.periodo || '-'}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm truncate font-semibold text-green-600">{record.valor || '-'}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                        {isSent ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                            Enviado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                            Pendente
                          </span>
                        )}
                      </td>
                      <td className="hidden lg:table-cell px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm truncate">{record.setorData}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div className="bg-gray-50 border-t border-gray-200 p-3 sm:p-5 flex flex-col gap-3 sm:gap-4">
            <div className="flex flex-col gap-2.5">
              <label htmlFor="phone" className="text-xs sm:text-sm font-medium text-gray-700">
                WhatsApp Destino
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">+55</span>
                <input
                  id="phone"
                  type={showPhone ? "text" : "password"}
                  placeholder="(11) 99999-9999"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className={cn(
                    "w-full pl-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-base",
                    contactsSupported ? "pr-16" : "pr-10"
                  )}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {contactsSupported && (
                    <button
                      onClick={pickContact}
                      type="button"
                      className="text-gray-400 hover:text-green-600 transition-colors p-1"
                      title="Selecionar da agenda"
                    >
                      <BookUser className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setShowPhone(!showPhone)}
                    type="button"
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                    title={showPhone ? "Ocultar" : "Mostrar"}
                  >
                    {showPhone ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={savePhone}
                  onChange={(e) => setSavePhone(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                />
                <span>Lembrar número</span>
              </label>
            </div>

            <div className="flex flex-col gap-2 sm:gap-3">
              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={sendWhatsAppMsg}
                  disabled={selectedIds.size === 0 || phoneNumber.replace(/\D/g, '').length < 10}
                  className={cn(
                    "flex items-center justify-center gap-2 px-5 sm:px-6 py-3 rounded-lg font-medium transition-all shadow-sm text-white text-sm sm:text-base flex-1",
                    selectedIds.size > 0 && phoneNumber.replace(/\D/g, '').length >= 10
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-gray-300 cursor-not-allowed text-gray-500"
                  )}
                >
                  <Send className="h-4 w-4" />
                  <span>WhatsApp ({selectedIds.size})</span>
                </button>

                <button
                  onClick={shareSelectedRecords}
                  disabled={selectedIds.size === 0}
                  className={cn(
                    "flex items-center justify-center gap-2 px-5 sm:px-6 py-3 rounded-lg font-medium transition-all shadow-sm text-white text-sm sm:text-base flex-1",
                    selectedIds.size > 0
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-gray-300 cursor-not-allowed text-gray-500"
                  )}
                >
                  <Share2 className="h-4 w-4" />
                  <span>Compartilhar ({selectedIds.size})</span>
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
