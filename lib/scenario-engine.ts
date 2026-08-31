import { z } from 'zod';

export type ChatMessage = {
  role: 'buyer' | 'seller';
  text: string;
  at: number;
  shouldEnd?: boolean;
};

export const BuyerTurnSchema = z.object({
  publicMessage: z.string().min(1).max(2_000),
  conversationStage: z.string().min(1),
  trustDelta: z.number().min(-10).max(10),
  interestDelta: z.number().min(-10).max(10),
  objectionState: z.string(),
  disclosedFacts: z.array(z.string()),
  buyerDecision: z.string(),
  shouldEnd: z.boolean(),
  internalSummary: z.string(),
});

export type BuyerTurn = z.infer<typeof BuyerTurnSchema>;

export function generateBuyerTurn(
  messages: ChatMessage[],
  turn: number,
): ChatMessage {
  const last = messages.at(-1)?.text.toLowerCase() || '';
  let text =
    'Конкретизируйте, пожалуйста: чем ваше предложение лучше для моего сервиса?';
  let shouldEnd = false;

  if (/объ[её]м|сколько|потреблен|месяц/.test(last)) {
    text =
      'Обычно берём около 20 комплектов в месяц, но сейчас хочу начать с 6. Если качество устроит, объём увеличим.';
  } else if (/важн|критер|что.*выбира|поставщик/.test(last)) {
    text =
      'Для меня важны стабильное качество и доставка максимум за два дня. С прошлым поставщиком были задержки.';
  } else if (/скидк|сниз|дешевле/.test(last)) {
    text =
      turn < 4
        ? 'Скидка интересна, но я не хочу выбирать только по цене. Что с наличием и заменой брака?'
        : 'Если зафиксируете доставку за два дня, готов обсудить тестовую партию без дополнительной скидки.';
  } else if (/оформ|заказ|встреч|кп|предложен|следующ/.test(last) && turn > 3) {
    text =
      'Хорошо, пришлите КП на 6 комплектов сегодня. Если условия совпадут, подтвержу тестовый заказ.';
    shouldEnd = true;
  } else if (turn > 6) {
    text =
      'Пока не услышал достаточно конкретики. Давайте вернёмся к разговору позже.';
    shouldEnd = true;
  } else if (turn === 2) {
    text =
      'А по качеству есть что-то конкретное? Конкурент обещает такую же гарантию, но цена ниже.';
  }

  return { role: 'buyer', text, at: Date.now(), shouldEnd };
}

const criteria = [
  [
    'Выявление потребностей',
    15,
    'Задайте вопросы об объёме, задачах и критериях выбора.',
  ],
  [
    'Знание продукта',
    15,
    'Используйте конкретные характеристики, цену, сроки и гарантию.',
  ],
  ['Объяснение ценности', 15, 'Свяжите преимущества товара с задачей клиента.'],
  [
    'Работа с возражениями',
    15,
    'Признайте сомнение клиента и ответьте по существу.',
  ],
  [
    'Переговоры и маржа',
    10,
    'Предлагайте скидку только в обмен на объём или другие условия.',
  ],
  [
    'Допродажа и альтернативы',
    10,
    'Предложите релевантный аналог или сопутствующий товар.',
  ],
  ['Завершение продажи', 10, 'Зафиксируйте конкретный следующий шаг и срок.'],
  [
    'Качество коммуникации',
    5,
    'Формулируйте ответы ясно, спокойно и достаточно подробно.',
  ],
  ['Точность и честность', 5, 'Не обещайте наличие и условия без проверки.'],
] as const;

const signals = [
  /\?|объ[её]м|потребност|критер|важно|задач/,
  /колод|цена|достав|гарант|характерист|налич/,
  /выгод|качест|стабиль|срок|эконом|ценност/,
  /конкур|понима|сомнен|возраж|согласен/,
  /скидк|услов|объ[её]м|марж|парт|отсроч/,
  /аналог|масло|фильтр|сопутств|альтернатив/,
  /заказ|кп|следующ|оформ|сегодня|завтра|встреч/,
  /.{35}/,
  /уточн|провер|не могу обещ|подтвержд|фактическ/,
];

export function evaluateSession(messages: ChatMessage[]) {
  const sellerMessages = messages.filter(
    (message) => message.role === 'seller',
  );
  const sellerText = sellerMessages.map((message) => message.text);

  const scored = criteria.map(([name, max, recommendation], index) => {
    const evidence = sellerText.find((text) =>
      signals[index].test(text.toLowerCase()),
    );
    const score = evidence ? Math.round(max * 0.82) : 0;
    return {
      name,
      max,
      score,
      recommendation,
      evidence: evidence
        ? `Есть подтверждение: «${evidence.slice(0, 90)}»`
        : 'В диалоге нет подтверждения этого навыка.',
    };
  });

  const weaknesses = [...scored]
    .sort((a, b) => a.score / a.max - b.score / b.max)
    .slice(0, 3)
    .map((criterion) => `${criterion.name}: ${criterion.recommendation}`);

  const total = scored.reduce((sum, criterion) => sum + criterion.score, 0);
  const buyerEnded = messages.at(-1)?.shouldEnd === true;

  return {
    total,
    outcome: buyerEnded
      ? 'Покупатель завершил сценарий'
      : sellerMessages.length
        ? 'Разговор завершён продавцом'
        : 'Тренировка завершена без ответа',
    criteria: scored,
    weaknesses,
  };
}
