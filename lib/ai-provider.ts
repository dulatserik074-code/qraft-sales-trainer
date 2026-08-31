import { BuyerTurnSchema, type BuyerTurn } from '@/lib/scenario-engine';

export type ProviderStatus = {
  available: boolean;
  quota: 'ok' | 'limited' | 'exhausted' | 'unknown';
  message: string;
};

export type GatewayProviderOptions = {
  endpoint: string;
  accessToken: string;
  provider?: 'gemini' | 'openrouter';
  timeoutMs?: number;
  clientId?: string;
};

export interface AIProvider {
  generateBuyerTurn(input: unknown): Promise<BuyerTurn>;
  evaluateSession(input: unknown): Promise<unknown>;
  generateCoaching(input: unknown): Promise<unknown>;
  healthCheck(): Promise<ProviderStatus>;
  getUsageStatus(): Promise<ProviderStatus>;
}

class GatewayError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean,
  ) {
    super(message);
  }
}

export class GatewayProvider implements AIProvider {
  private readonly timeoutMs: number;

  constructor(private readonly options: GatewayProviderOptions) {
    this.timeoutMs = options.timeoutMs ?? 25_000;
  }

  private clientId() {
    if (this.options.clientId) return this.options.clientId;
    if (typeof window === 'undefined') return '';
    const storageKey = 'qraft-client-id';
    const existing = window.localStorage.getItem(storageKey);
    if (existing) return existing;
    const created = window.crypto.randomUUID();
    window.localStorage.setItem(storageKey, created);
    return created;
  }

  private async call(operation: string, input: unknown) {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const response = await fetch(this.options.endpoint, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${this.options.accessToken}`,
            apikey: this.options.accessToken,
            'x-client-info': 'qraft-sales-trainer/0.2.1',
            'x-client-id': this.clientId(),
          },
          body: JSON.stringify({
            operation,
            input,
            provider: this.options.provider ?? 'gemini',
          }),
          signal: controller.signal,
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          const message =
            payload && typeof payload === 'object' && 'error' in payload
              ? String(payload.error)
              : `provider-${response.status}`;
          throw new GatewayError(
            message,
            response.status === 408 ||
              response.status === 429 ||
              response.status >= 500,
          );
        }
        return payload;
      } catch (error) {
        lastError =
          error instanceof Error ? error : new Error('gateway-unavailable');
        if (error instanceof GatewayError && !error.retryable) throw error;
        if (attempt < 2) {
          await new Promise((resolve) =>
            setTimeout(resolve, 350 * 2 ** attempt),
          );
        }
      } finally {
        clearTimeout(timeout);
      }
    }

    throw lastError ?? new Error('gateway-unavailable');
  }

  async generateBuyerTurn(input: unknown) {
    return BuyerTurnSchema.parse(await this.call('buyer', input));
  }

  evaluateSession(input: unknown) {
    return this.call('evaluate', input);
  }

  generateCoaching(input: unknown) {
    return this.call('coach', input);
  }

  healthCheck() {
    return this.call('health', {}) as Promise<ProviderStatus>;
  }

  getUsageStatus() {
    return this.call('usage', {}) as Promise<ProviderStatus>;
  }
}
