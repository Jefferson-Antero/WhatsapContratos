import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseSpreadsheetFromBuffer } from './src/lib/spreadsheetParser';
import {
  initializeDatabase,
  insertPaymentRecord,
  getAllPaymentRecords,
  deleteAllPaymentRecords,
  recordPaymentSent,
  getSentPaymentIds,
  getPaymentHistory,
  deletePaymentSent,
} from './src/database';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Criar pasta de uploads se não existir
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Inicializar banco de dados
initializeDatabase();

app.use(express.json());
app.use(express.raw({ type: 'application/octet-stream', limit: '50mb' }));

// Endpoint para fazer upload do arquivo
app.post('/api/upload', async (req, res) => {
  try {
    const buffer = req.body as Buffer;
    if (!buffer || buffer.length === 0) {
      return res.status(400).json({ error: 'Nenhum arquivo foi enviado' });
    }

    const fileName = 'planilha.xlsx';
    const filePath = path.join(UPLOADS_DIR, fileName);
    
    fs.writeFileSync(filePath, buffer);

    // Parsear e salvar no banco de dados
    const records = await parseSpreadsheetFromBuffer(buffer.buffer);
    
    // Limpar registros antigos e inserir novos
    deleteAllPaymentRecords();
    
    for (const record of records) {
      insertPaymentRecord({
        id: record.id,
        contratoObjeto: record.contratoObjeto,
        processo: record.processo,
        periodo: record.periodo || '-',
        valor: record.valor || '-',
        setorData: record.setorData,
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Arquivo salvo com sucesso',
      fileName,
      recordsCount: records.length
    });
  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    res.status(500).json({ error: 'Erro ao salvar arquivo' });
  }
});

// Endpoint para verificar se existe arquivo
app.get('/api/check-upload', (req, res) => {
  try {
    const fileName = 'planilha.xlsx';
    const filePath = path.join(UPLOADS_DIR, fileName);
    
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      res.json({ 
        exists: true, 
        fileName,
        size: stats.size,
        uploadedAt: stats.mtime
      });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    console.error('Erro ao verificar arquivo:', error);
    res.status(500).json({ error: 'Erro ao verificar arquivo' });
  }
});

// Endpoint para deletar arquivo
app.delete('/api/upload/:fileName', (req, res) => {
  try {
    const { fileName } = req.params;
    const filePath = path.join(UPLOADS_DIR, fileName);
    
    // Segurança: só permitir deletar planilha.xlsx
    if (fileName !== 'planilha.xlsx') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true, message: 'Arquivo deletado com sucesso' });
    } else {
      res.status(404).json({ error: 'Arquivo não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao deletar arquivo:', error);
    res.status(500).json({ error: 'Erro ao deletar arquivo' });
  }
});

// Endpoint para obter o arquivo
app.get('/api/upload/:fileName', (req, res) => {
  try {
    const { fileName } = req.params;
    const filePath = path.join(UPLOADS_DIR, fileName);
    
    // Segurança: só permitir acessar planilha.xlsx
    if (fileName !== 'planilha.xlsx') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    if (fs.existsSync(filePath)) {
      res.download(filePath);
    } else {
      res.status(404).json({ error: 'Arquivo não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao obter arquivo:', error);
    res.status(500).json({ error: 'Erro ao obter arquivo' });
  }
});

// ==================== ENDPOINTS DE REGISTROS ====================

// Endpoint para obter todos os registros de pagamento
app.get('/api/records', (req, res) => {
  try {
    const records = getAllPaymentRecords();
    const sentIds = getSentPaymentIds();

    res.json({
      success: true,
      count: records.length,
      records: records.map(r => ({
        id: r.id,
        contratoObjeto: r.contrato_objeto,
        processo: r.processo,
        periodo: r.periodo,
        valor: r.valor,
        periodoValor: `${r.periodo} - ${r.valor}`,
        setorData: r.setor_data,
        sent: sentIds.includes(r.id),
      })),
      sentIds,
    });
  } catch (error) {
    console.error('Erro ao obter registros:', error);
    res.status(500).json({ error: 'Erro ao obter registros' });
  }
});

// ==================== ENDPOINTS DE PAGAMENTOS ====================

// Registrar um pagamento como enviado
app.post('/api/payments/sent', (req, res) => {
  try {
    const { recordId, recordData, phoneNumber, sentAt } = req.body;

    // Validações
    if (!recordId) {
      return res.status(400).json({ error: 'recordId é obrigatório' });
    }

    // Registrar no banco de dados
    recordPaymentSent(recordId, phoneNumber || '');

    res.status(201).json({
      success: true,
      message: 'Pagamento registrado com sucesso',
      recordId
    });
  } catch (error) {
    console.error('Erro ao registrar pagamento:', error);
    res.status(500).json({ error: 'Erro ao registrar pagamento' });
  }
});

// Recuperar histórico de pagamentos enviados
app.get('/api/payments/sent', (req, res) => {
  try {
    const history = getPaymentHistory();
    
    res.json({
      success: true,
      count: history.length,
      payments: history
    });
  } catch (error) {
    console.error('Erro ao recuperar pagamentos:', error);
    res.status(500).json({ error: 'Erro ao recuperar pagamentos' });
  }
});

// Verificar se um pagamento específico foi enviado
app.get('/api/payments/sent/:recordId', (req, res) => {
  try {
    const { recordId } = req.params;
    const sentIds = getSentPaymentIds();
    const exists = sentIds.includes(recordId);
    
    res.json({
      success: true,
      exists,
      message: exists ? 'Pagamento registrado' : 'Pagamento não registrado'
    });
  } catch (error) {
    console.error('Erro ao verificar pagamento:', error);
    res.status(500).json({ error: 'Erro ao verificar pagamento' });
  }
});

// Deletar um registro de pagamento
app.delete('/api/payments/sent/:recordId', (req, res) => {
  try {
    const { recordId } = req.params;
    deletePaymentSent(recordId);

    res.json({
      success: true,
      message: 'Pagamento removido com sucesso',
      recordId
    });
  } catch (error) {
    console.error('Erro ao deletar pagamento:', error);
    res.status(500).json({ error: 'Erro ao deletar pagamento' });
  }
});

// Limpar todos os registros de pagamentos (útil para reset)
app.post('/api/payments/reset', (req, res) => {
  try {
    const sentIds = getSentPaymentIds();
    const count = sentIds.length;
    
    for (const recordId of sentIds) {
      deletePaymentSent(recordId);
    }

    res.json({
      success: true,
      message: `${count} registros de pagamento foram removidos`,
      cleared: count
    });
  } catch (error) {
    console.error('Erro ao resetar pagamentos:', error);
    res.status(500).json({ error: 'Erro ao resetar pagamentos' });
  }
});

// Serve frontend static files in production
const distDir = path.join(__dirname, 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
