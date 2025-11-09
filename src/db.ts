/**
 * ===============================================================
 *  Database Layer  —  Intelligenter Project
 * ===============================================================
 */

import fs from "fs";
const initSqlJs: any = require("sql.js");

let db: any; // active in-memory DB instance

/**
 * Initializes the SQLite database.
 * Loads an existing DB file if present, otherwise creates a new one.
 */
export async function initDB() {
  const SQL = await initSqlJs();
  const dbFile = "app.db";

  if (fs.existsSync(dbFile)) {
    const fileBuffer = fs.readFileSync(dbFile);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
    db.run(`
      CREATE TABLE IF NOT EXISTS domains (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        domain TEXT UNIQUE NOT NULL,
        status TEXT NOT NULL,           -- analyzing | completed | error
        whois_data TEXT,
        virustotal_data TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT,
        last_scan_date TEXT
      );
    `);
    saveDB();
  }
}

/**
 * Persists the in-memory database to disk.
 */
function saveDB() {
  const data = db.export();
  fs.writeFileSync("app.db", Buffer.from(data));
}

/**
 * Inserts a new domain record with initial status 'analyzing'.
 * Called when a domain is first submitted for analysis.
 */
export async function insertDomain(domain: string) {
  const created_at = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO domains (domain, status, created_at)
    VALUES (?, 'analyzing', ?);
  `);
  stmt.run([domain, created_at]);
  stmt.free();
  saveDB();
}

/**
 * Updates an existing domain once analysis completes.
 * NOTE: from now on, we save *raw* API JSON strings here.
 */
export async function updateDomainAnalysis(
  domain: string,
  whois_data: string,
  virustotal_data: string
) {
  const updated_at = new Date().toISOString();
  const stmt = db.prepare(`
    UPDATE domains
    SET whois_data = ?,                 -- raw WHOIS JSON
        virustotal_data = ?,            -- raw VirusTotal JSON
        status = 'completed',
        updated_at = ?, 
        last_scan_date = ?
    WHERE domain = ?;
  `);
  console.log("[DB] Updating domain:", domain);
  stmt.run([whois_data, virustotal_data, updated_at, updated_at, domain]);
  stmt.free();
  saveDB();
}

/**
 * NEW: optional helper to store failed analysis safely (raw error text).
 * Call this if analyzer catches an exception, to keep consistent status.
 */
export async function markDomainError(domain: string, errorObj: any) {
  const updated_at = new Date().toISOString();
  const stmt = db.prepare(`
    UPDATE domains
    SET status = 'error',
        whois_data = ?,
        virustotal_data = ?,
        updated_at = ?
    WHERE domain = ?;
  `);
  stmt.run([
    JSON.stringify(errorObj?.whois || {}),
    JSON.stringify(errorObj?.vt || {}),
    updated_at,
    domain
  ]);
  stmt.free();
  saveDB();
}

/**
 * Retrieves all domain records (most recent first).
 */
export async function getAllDomains() {
  const results = db.exec("SELECT * FROM domains ORDER BY id DESC");
  if (results.length === 0) return [];
  const columns = results[0].columns;
  const values = results[0].values;
  return values.map((row: any[]) =>
    Object.fromEntries(row.map((val, i) => [columns[i], val]))
  );
}

/**
 * Finds a single domain record by its name.
 * Returns null if the domain is not found in the database.
 */
export async function getDomainByName(domain: string) {
  const stmt = db.prepare(`
    SELECT * FROM domains WHERE domain = ?;
  `);
  const result = stmt.getAsObject([domain]);
  stmt.free();
  return result && result.domain ? result : null;
}
