import { describe, expect, it } from 'vitest';
import {
  BuyerTurnSchema,
  evaluateSession,
  generateBuyerTurn,
  type ChatMessage,
} from './scenario-engine';

const buyer: ChatMessage = { role: 'buyer', text: 'Что предложите?', at: 1 };

describe('deterministic scenario engine', () => {
  it('does not disclose volume until asked', () => {
    expect(
      generateBuyerTurn(
        [buyer, { role: 'seller', text: 'Расскажите подробнее', at: 2 }],
        1,
      ).text,
    ).not.toContain('20 комплектов');
  });

  it('discloses remembered volume after a relevant question', () => {
    expect(
      generateBuyerTurn(
        [buyer, { role: 'seller', text: 'Какой объём берёте в месяц?', at: 2 }],
        2,
      ).text,
    ).toContain('20 комплектов');
  });

  it('reacts to discount', () => {
    expect(
      generateBuyerTurn(
        [buyer, { role: 'seller', text: 'Дадим скидку', at: 2 }],
        2,
      ).text,
    ).toContain('Скидка');
  });

  it('does not award points without seller evidence', () => {
    const result = evaluateSession([buyer]);
    expect(result.total).toBe(0);
    expect(result.criteria.every((criterion) => criterion.score === 0)).toBe(
      true,
    );
  });

  it('creates evidence and dynamic weaknesses', () => {
    const result = evaluateSession([
      buyer,
      {
        role: 'seller',
        text: 'Какой объём вам нужен в месяц и какие критерии для вас важны?',
        at: 2,
      },
    ]);
    expect(result.total).toBeGreaterThan(0);
    expect(result.total).toBeLessThanOrEqual(100);
    expect(result.criteria).toHaveLength(9);
    expect(
      result.criteria.every((criterion) => criterion.evidence.length > 0),
    ).toBe(true);
    expect(result.weaknesses).toHaveLength(3);
    expect(result.weaknesses.join(' ')).not.toContain('Выявление потребностей');
  });

  it('validates structured AI buyer output', () => {
    expect(
      BuyerTurnSchema.safeParse({
        publicMessage: 'Да',
        conversationStage: 'contact',
        trustDelta: 1,
        interestDelta: 0,
        objectionState: 'none',
        disclosedFacts: [],
        buyerDecision: 'continue',
        shouldEnd: false,
        internalSummary: 'ok',
      }).success,
    ).toBe(true);
  });
});
