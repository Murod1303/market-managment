/**
 * Server Environment Configuration
 * Centralized reading and normalization of environment variables
 */

export function getCleanTelegramBotToken(custom?: string): string {
  const token = (custom || process.env.TELEGRAM_BOT_TOKEN || '').trim();
  return token.replace(/^["']|["']$/g, '').trim();
}

export function getPublicAppUrl(): string | undefined {
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    const d = process.env.RAILWAY_PUBLIC_DOMAIN.trim().replace(/^https?:\/\//, '');
    return `https://${d}`;
  }
  if (process.env.APP_URL) {
    const u = process.env.APP_URL.trim().replace(/\/$/, '');
    if (!u.includes('.run.app') && !u.includes('localhost') && !u.includes('127.0.0.1')) {
      return u.startsWith('http') ? u : `https://${u}`;
    }
  }
  return undefined;
}

export const env = {
  PORT: 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY?.trim(),
  TELEGRAM_BOT_TOKEN: getCleanTelegramBotToken(),
  TELEGRAM_BOT_MODE: process.env.TELEGRAM_BOT_MODE?.trim() || 'polling',
  MONGODB_URI: (
    process.env.MONGODB_URI ||
    process.env.MONGO_URL ||
    process.env.MONGO_PRIVATE_URL ||
    process.env.DATABASE_URL ||
    ''
  ).replace(/^["']|["']$/g, '').trim(),
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME?.trim() || 'smartsavdo',
};
