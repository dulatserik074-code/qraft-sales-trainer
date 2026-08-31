import { afterEach, describe, expect, it, vi } from 'vitest';
import { GatewayProvider } from './ai-provider';

const buyerTurn = {
  publicMessage: 'Какие сроки доставки?',
  conversationStage: 'needs',
  trustDelta: 1,
  interestDelta: 2,
  objectionState: 'delivery',
  disclosedFacts: ['Нужна доставка за два дня'],
  buyerDecision: 'continue',
  shouldEnd: false,
  internalSummary: 'Buyer needs a firm delivery commitment.',
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('GatewayProvider', () => {
  it('sends authorization and validates buyer output', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(buyerTurn), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const provider = new GatewayProvider({
      endpoint: 'https://example.test/functions/v1/ai-gateway',
      accessToken: 'public-anon-token',
      provider: 'gemini',
      clientId: 'd9428888-122b-11e1-b85c-61cd3cbb3210',
    });
    await expect(provider.generateBuyerTurn({ messages: [] })).resolves.toEqual(
      buyerTurn,
    );

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.authorization).toBe('Bearer public-anon-token');
    expect(init.headers.apikey).toBe('public-anon-token');
    expect(init.headers['x-client-id']).toBe(
      'd9428888-122b-11e1-b85c-61cd3cbb3210',
    );
    expect(JSON.parse(init.body)).toMatchObject({
      operation: 'buyer',
      provider: 'gemini',
    });
  });

  it('rejects malformed provider output', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ publicMessage: 'Incomplete' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    );
    const provider = new GatewayProvider({
      endpoint: 'https://example.test/functions/v1/ai-gateway',
      accessToken: 'public-anon-token',
    });
    await expect(
      provider.generateBuyerTurn({ messages: [] }),
    ).rejects.toThrow();
  });
});
