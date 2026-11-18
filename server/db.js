// Tiny JSON-file store. Seeded automatically on first boot; writes are
// debounced + atomic (tmp file + rename). No external database needed.
import fs from 'node:fs';
import path from 'node:path';
import { buildSeed } from './seed.js';

const DATA_DIR = path.resolve(process.env.DATA_DIR || './data');
const FILE = path.join(DATA_DIR, 'db.json');
const SCHEMA_VERSION = 1;

let db = null;
let timer = null;

export function load() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(FILE, 'utf8'));
      if (parsed?.meta?.version === SCHEMA_VERSION) {
        db = parsed;
        console.log(`[db] loaded ${FILE}`);
        return db;
      }
    } catch (err) {
      console.warn('[db] corrupt store, reseeding:', err.message);
    }
  }
  return reset();
}

export function reset() {
  db = buildSeed();
  flush();
  console.log(`[db] seeded ${db.students.length} students, ${db.reports.length} reports → ${FILE}`);
  return db;
}

export function get() {
  return db;
}

export function save() {
  clearTimeout(timer);
  timer = setTimeout(flush, 150);
}

export function flush() {
  const tmp = `${FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db));
  fs.renameSync(tmp, FILE);
}
