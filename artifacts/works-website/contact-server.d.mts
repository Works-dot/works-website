export function sendContactMessage(payload: unknown, logger?: { error(message: string): void; info(message: string): void }): Promise<{
  status: number;
  body: { ok: boolean; code: string };
}>;
