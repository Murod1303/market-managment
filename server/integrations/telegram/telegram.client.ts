import { getCleanTelegramBotToken } from '../../config/env.ts';

export interface TelegramSendMessageOptions {
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  reply_markup?: any;
}

export class TelegramClient {
  private token: string;

  constructor(token?: string) {
    this.token = getCleanTelegramBotToken(token);
  }

  setToken(token: string) {
    this.token = getCleanTelegramBotToken(token);
  }

  getToken(): string {
    return this.token;
  }

  private getUrl(endpoint: string): string {
    return `https://api.telegram.org/bot${this.token}/${endpoint}`;
  }

  async getMe(): Promise<any> {
    if (!this.token) return { ok: false, description: 'Token topilmadi' };
    const res = await fetch(this.getUrl('getMe'), {
      signal: AbortSignal.timeout(8000),
    });
    return await res.json();
  }

  async sendMessage(chatId: number | string, text: string, options?: TelegramSendMessageOptions): Promise<any> {
    if (!this.token) return null;
    const body: any = {
      chat_id: chatId,
      text,
      parse_mode: options?.parse_mode || 'HTML',
    };
    if (options?.reply_markup) {
      body.reply_markup = options.reply_markup;
    }

    try {
      const res = await fetch(this.getUrl('sendMessage'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
      });
      return await res.json();
    } catch (err: any) {
      console.warn('[TelegramClient] sendMessage error:', err?.message || err);
      return null;
    }
  }

  async answerCallbackQuery(callbackQueryId: string, text?: string): Promise<any> {
    if (!this.token) return null;
    try {
      const res = await fetch(this.getUrl('answerCallbackQuery'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: callbackQueryId, text, show_alert: !!text }),
        signal: AbortSignal.timeout(5000),
      });
      return await res.json();
    } catch (err: any) {
      console.warn('[TelegramClient] answerCallbackQuery error:', err?.message || err);
      return null;
    }
  }

  async editMessageReplyMarkup(chatId: number | string, messageId: number, replyMarkup: any): Promise<any> {
    if (!this.token) return null;
    try {
      const res = await fetch(this.getUrl('editMessageReplyMarkup'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, message_id: messageId, reply_markup: replyMarkup }),
        signal: AbortSignal.timeout(5000),
      });
      return await res.json();
    } catch (err: any) {
      console.warn('[TelegramClient] editMessageReplyMarkup error:', err?.message || err);
      return null;
    }
  }

  async setWebhook(url: string): Promise<any> {
    if (!this.token) return { ok: false, description: 'No token' };
    const res = await fetch(this.getUrl('setWebhook'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(8000),
    });
    return await res.json();
  }

  async deleteWebhook(): Promise<any> {
    if (!this.token) return { ok: false };
    const res = await fetch(this.getUrl('deleteWebhook'), {
      signal: AbortSignal.timeout(8000),
    });
    return await res.json().catch(() => ({ ok: false }));
  }

  async getWebhookInfo(): Promise<any> {
    if (!this.token) return { ok: false };
    const res = await fetch(this.getUrl('getWebhookInfo'), {
      signal: AbortSignal.timeout(8000),
    });
    return await res.json().catch(() => ({ ok: false }));
  }

  async getUpdates(offset: number, timeoutSeconds: number = 15, signal?: AbortSignal): Promise<any> {
    if (!this.token) return { ok: false, description: 'No token' };
    const res = await fetch(this.getUrl(`getUpdates?offset=${offset}&timeout=${timeoutSeconds}`), {
      signal,
    });
    return await res.json();
  }

  async getFile(fileId: string): Promise<any> {
    if (!this.token) return null;
    const res = await fetch(this.getUrl(`getFile?file_id=${fileId}`), {
      signal: AbortSignal.timeout(10000),
    });
    return await res.json();
  }

  async downloadFileAsBase64(filePath: string): Promise<string | null> {
    if (!this.token) return null;
    try {
      const fileUrl = `https://api.telegram.org/file/bot${this.token}/${filePath}`;
      const res = await fetch(fileUrl, { signal: AbortSignal.timeout(20000) });
      const arrayBuffer = await res.arrayBuffer();
      return Buffer.from(arrayBuffer).toString('base64');
    } catch (err: any) {
      console.warn('[TelegramClient] File download error:', err?.message || err);
      return null;
    }
  }
}

export const telegramClient = new TelegramClient();
