import path from 'path';

export const DATA_DIR = path.join(process.cwd(), 'data');
export const DB_FILE = path.join(DATA_DIR, 'store_db.json');
export const USERS_FILE = path.join(DATA_DIR, 'users_db.json');
export const DIST_DIR = path.join(process.cwd(), 'dist');
