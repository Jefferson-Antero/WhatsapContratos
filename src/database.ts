import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'data', 'app.db');

// Garantir que a pasta data existe
import fs from 'fs';
const DATA_DIR = path.dirname(DB_PATH);
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let db: Database.Database;

export function initializeDatabase(): Database.Database {
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  // Criar tabelas
  db.exec(`
    CREATE TABLE IF NOT EXISTS payment_records (
      id TEXT PRIMARY KEY,
      contrato_objeto TEXT NOT NULL,
      processo TEXT NOT NULL,
      periodo TEXT,
      valor TEXT,
      setor_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payments_sent (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_id TEXT NOT NULL,
      phone_number TEXT,
      sent_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (record_id) REFERENCES payment_records(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_record_id ON payments_sent(record_id);
  `);

  return db;
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

// ==================== PAYMENT RECORDS ====================

export function insertPaymentRecord(record: {
  id: string;
  contratoObjeto: string;
  processo: string;
  periodo: string;
  valor: string;
  setorData: string;
}): void {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO payment_records 
    (id, contrato_objeto, processo, periodo, valor, setor_data, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);

  stmt.run(
    record.id,
    record.contratoObjeto,
    record.processo,
    record.periodo,
    record.valor,
    record.setorData
  );
}

export function getAllPaymentRecords(): any[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT id, contrato_objeto, processo, periodo, valor, setor_data, created_at, updated_at
    FROM payment_records
    ORDER BY created_at ASC
  `);

  return stmt.all();
}

export function deleteAllPaymentRecords(): void {
  const db = getDatabase();
  db.exec('DELETE FROM payment_records');
}

// ==================== PAYMENTS SENT ====================

export function recordPaymentSent(recordId: string, phoneNumber: string): void {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO payments_sent (record_id, phone_number, sent_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
  `);

  stmt.run(recordId, phoneNumber);
}

export function getSentPaymentIds(): string[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT DISTINCT record_id FROM payments_sent
  `);

  const results = stmt.all() as any[];
  return results.map(r => r.record_id);
}

export function getPaymentHistory(): any[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT 
      ps.id,
      ps.record_id,
      pr.contrato_objeto,
      pr.processo,
      pr.periodo,
      pr.valor,
      pr.setor_data,
      ps.phone_number,
      ps.sent_at,
      ps.created_at
    FROM payments_sent ps
    LEFT JOIN payment_records pr ON ps.record_id = pr.id
    ORDER BY ps.created_at DESC
  `);

  return stmt.all();
}

export function deletePaymentSent(recordId: string): void {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM payments_sent WHERE record_id = ?');
  stmt.run(recordId);
}
