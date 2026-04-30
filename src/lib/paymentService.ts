import { PaymentRecord } from '../types';

export interface SentPayment {
  recordId: string;
  recordData: PaymentRecord;
  phoneNumber: string;
  sentAt: string;
  createdAt: string;
}

const API_BASE = '';

/**
 * Registra um pagamento como enviado no backend
 */
export async function registerSentPayment(
  recordId: string,
  recordData: PaymentRecord,
  phoneNumber: string
): Promise<SentPayment> {
  try {
    const response = await fetch('/api/payments/sent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recordId,
        recordData,
        phoneNumber,
        sentAt: new Date().toISOString()
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao registrar pagamento');
    }

    const data = await response.json();
    return data.payment;
  } catch (error) {
    console.error('Erro ao registrar pagamento no servidor:', error);
    throw error;
  }
}

/**
 * Recupera o histórico de pagamentos enviados
 */
export async function fetchSentPayments(): Promise<SentPayment[]> {
  try {
    const response = await fetch('/api/payments/sent');
    
    if (!response.ok) {
      throw new Error('Erro ao recuperar histórico de pagamentos');
    }

    const data = await response.json();
    return data.payments || [];
  } catch (error) {
    console.error('Erro ao buscar pagamentos do servidor:', error);
    throw error;
  }
}

/**
 * Verifica se um pagamento específico foi enviado
 */
export async function checkPaymentSent(recordId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/payments/sent/${recordId}`);
    
    if (!response.ok) {
      throw new Error('Erro ao verificar pagamento');
    }

    const data = await response.json();
    return data.exists || false;
  } catch (error) {
    console.error('Erro ao verificar pagamento no servidor:', error);
    return false;
  }
}

/**
 * Remove um registro de pagamento do backend
 */
export async function removeSentPayment(recordId: string): Promise<void> {
  try {
    const response = await fetch(`/api/payments/sent/${recordId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao remover pagamento');
    }
  } catch (error) {
    console.error('Erro ao remover pagamento do servidor:', error);
    throw error;
  }
}

/**
 * Sincroniza pagamentos locais com o backend
 * Envia todos os pagamentos que foram marcados como enviados localmente
 */
export async function syncPaymentsToBackend(
  records: PaymentRecord[],
  sentIds: Set<string>,
  phoneNumber: string
): Promise<{ successful: number; failed: number; errors: string[] }> {
  const errors: string[] = [];
  let successful = 0;
  let failed = 0;

  for (const recordId of sentIds) {
    try {
      const record = records.find(r => r.id === recordId);
      if (record) {
        await registerSentPayment(recordId, record, phoneNumber);
        successful++;
      }
    } catch (error) {
      failed++;
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      errors.push(`${recordId}: ${errorMsg}`);
    }
  }

  return { successful, failed, errors };
}

/**
 * Carrega registros de pagamentos do backend
 */
export async function fetchPaymentRecords(): Promise<PaymentRecord[]> {
  try {
    const response = await fetch('/api/records');
    
    if (!response.ok) {
      throw new Error('Erro ao recuperar registros');
    }

    const data = await response.json();
    return data.records || [];
  } catch (error) {
    console.error('Erro ao buscar registros do servidor:', error);
    throw error;
  }
}

/**
 * Carrega IDs de pagamentos enviados do backend
 */
export async function fetchSentPaymentIds(): Promise<Set<string>> {
  try {
    const response = await fetch('/api/records');
    
    if (!response.ok) {
      throw new Error('Erro ao recuperar registros');
    }

    const data = await response.json();
    return new Set(data.sentIds || []);
  } catch (error) {
    console.error('Erro ao buscar IDs enviados do servidor:', error);
    return new Set();
  }
}
