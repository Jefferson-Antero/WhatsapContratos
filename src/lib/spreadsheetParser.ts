import * as xlsx from 'xlsx';
import { PaymentRecord } from '../types';

export async function parseSpreadsheetFromBuffer(
  fileBuffer: ArrayBuffer
): Promise<PaymentRecord[]> {
  try {
    const wb = xlsx.read(fileBuffer, { type: 'binary' });
    const wsname = wb.SheetNames[0];
    const ws = wb.Sheets[wsname];
    const rawData = xlsx.utils.sheet_to_json(ws, {
      header: 1,
      raw: false,
      blankrows: false,
    }) as any[][];

    // Encontrar a linha de cabeçalho
    let headerRowIndex = -1;
    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      if (Array.isArray(row)) {
        const rowStr = row.map(cell => String(cell || '')).join(' ').toUpperCase();
        if (
          rowStr.includes('CONTRATO') &&
          rowStr.includes('PROCESSO') &&
          rowStr.includes('VALOR')
        ) {
          headerRowIndex = i;
          break;
        }
      }
    }

    const parsedRecords: PaymentRecord[] = [];
    if (headerRowIndex !== -1) {
      let recordIndex = 0;
      for (let i = headerRowIndex + 1; i < rawData.length; i++) {
        const row = rawData[i];
        
        // Pular linhas vazias
        if (!row || row.length === 0) continue;
        
        // Pular se a primeira coluna está vazia
        if (!row[0]) continue;

        const contratoObjeto = row[0] ? String(row[0]).trim() : '';
        const processo = row[1] ? String(row[1]).trim() : '';
        const periodo = row[2] ? String(row[2]).trim() : '';
        const valor = row[3] ? String(row[3]).trim() : '';
        const setorData = row[4] ? String(row[4]).trim() : '';

        // Validar que pelo menos processo e contrato existem
        if (processo && contratoObjeto) {
          parsedRecords.push({
            id: `row-${recordIndex}`,
            contratoObjeto: contratoObjeto || '-',
            processo: processo || '-',
            periodoValor: periodo ? `${periodo} - ${valor}` : valor || '-',
            setorData: setorData || '-',
            // Novos campos
            periodo: periodo || '-',
            valor: valor || '-',
          });
          recordIndex++;
        }
      }
    }

    return parsedRecords;
  } catch (error) {
    console.error('Erro ao processar planilha:', error);
    throw new Error('Erro ao processar planilha');
  }
}

export async function fetchAndParseSpreadsheet(): Promise<PaymentRecord[] | null> {
  try {
    // Verificar se existe arquivo no servidor
    const checkResponse = await fetch('/api/check-upload');
    const checkData = await checkResponse.json();

    if (!checkData.exists) {
      return null;
    }

    // Baixar o arquivo
    const fileResponse = await fetch('/api/upload/planilha.xlsx');
    if (!fileResponse.ok) {
      console.error('Erro ao baixar arquivo');
      return null;
    }

    const fileBuffer = await fileResponse.arrayBuffer();

    // Processar a planilha
    const records = await parseSpreadsheetFromBuffer(fileBuffer);
    return records;
  } catch (error) {
    console.error('Erro ao buscar e processar planilha:', error);
    return null;
  }
}
