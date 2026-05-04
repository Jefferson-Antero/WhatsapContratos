import ExcelJS from 'exceljs';
import { PaymentRecord } from '../types';

function getCellText(value: any): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return String(value);
  if (value instanceof Date) return value.toLocaleDateString('pt-BR');
  // Rich text: { richText: [{ text: '...' }, ...] }
  if (value.richText && Array.isArray(value.richText)) {
    return value.richText.map((rt: any) => rt.text ?? '').join('').trim();
  }
  // Fórmula: { formula: '...', result: valor }
  if (value.result !== undefined) {
    return getCellText(value.result);
  }
  // Hyperlink: { text: '...', hyperlink: '...' }
  if (value.text !== undefined) {
    return String(value.text).trim();
  }
  return String(value).trim();
}

const brlFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function formatCurrency(value: any): string {
  if (value === null || value === undefined) return '';

  // Número puro do Excel (caso mais comum para células de moeda)
  if (typeof value === 'number') {
    return brlFormatter.format(value);
  }

  // Fórmula com resultado numérico
  if (value?.result !== undefined && typeof value.result === 'number') {
    return brlFormatter.format(value.result);
  }

  const str = getCellText(value);
  if (!str) return '';

  // Já contém símbolo de moeda — retorna como está
  if (str.includes('R$')) return str;

  // Tenta converter string para número (suporta "1.234,56" e "1234.56")
  const normalized = str.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(normalized);
  if (!isNaN(num)) return brlFormatter.format(num);

  // Não é número — retorna o texto original
  return str;
}

export async function parseSpreadsheetFromBuffer(
  fileBuffer: ArrayBuffer
): Promise<PaymentRecord[]> {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer);
    const worksheet = workbook.worksheets[0];
    
    // Converter planilha em dados brutos
    const rawData: any[][] = [];
    worksheet.eachRow((row) => {
      rawData.push(row.values as any[]);
    });

    // Encontrar a linha de cabeçalho
    let headerRowIndex = -1;
    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      if (Array.isArray(row)) {
        const rowStr = row.map(cell => getCellText(cell)).join(' ').toUpperCase();
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

        // ExcelJS row.values é 1-indexado (índice 0 é sempre undefined)
        // Pular se a primeira coluna está vazia
        if (!row[1]) continue;

        const contratoObjeto = getCellText(row[1]);
        const processo = getCellText(row[2]);
        const periodo = getCellText(row[3]);
        const valor = formatCurrency(row[4]);
        const setorData = getCellText(row[5]);

        // Validar que pelo menos processo e contrato existem
        if (processo && contratoObjeto) {
          parsedRecords.push({
            id: `row-${recordIndex}`,
            contratoObjeto: contratoObjeto || '-',
            processo: processo || '-',
            periodoValor: periodo && valor ? `${periodo} - ${valor}` : valor || periodo || '-',
            setorData: setorData || '-',
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
