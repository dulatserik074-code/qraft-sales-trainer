'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  Bot,
  Box,
  Building2,
  ChevronRight,
  CloudOff,
  FileUp,
  Gauge,
  Languages,
  LoaderCircle,
  Menu,
  MessageCircle,
  Moon,
  Play,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  Users,
  X,
} from 'lucide-react';
import { GatewayProvider } from '@/lib/ai-provider';
import { demoProducts } from '@/lib/demo-data';
import {
  evaluateSession,
  generateBuyerTurn,
  type ChatMessage,
} from '@/lib/scenario-engine';
type View =
  | 'dashboard'
  | 'training'
  | 'result'
  | 'catalog'
  | 'scenarios'
  | 'scripts'
  | 'analytics'
  | 'team'
  | 'rules'
  | 'ai';
const nav = [
  ['dashboard', 'Главная', Gauge],
  ['training', 'Тренировка', MessageCircle],
  ['catalog', 'Каталог', Box],
  ['scenarios', 'Сценарии', Target],
  ['scripts', 'Мои скрипты', BookOpen],
  ['analytics', 'Аналитика', BarChart3],
  ['team', 'Команда', Users],
  ['rules', 'Правила продаж', ShieldCheck],
  ['ai', 'Настройки ИИ', Bot],
] as const;
const initial: ChatMessage = {
  role: 'buyer',
  text: 'Добрый день. Ищу тормозные колодки для сервиса, но у конкурента дешевле. Что можете предложить?',
  at: Date.now(),
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
const gatewayEndpoint =
  process.env.NEXT_PUBLIC_AI_GATEWAY_URL ||
  (supabaseUrl ? `${supabaseUrl}/functions/v1/ai-gateway` : '');
const gatewayToken = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const cloudProviderName =
  process.env.NEXT_PUBLIC_AI_PROVIDER === 'openrouter'
    ? 'openrouter'
    : 'gemini';
const cloudAI =
  gatewayEndpoint && gatewayToken
    ? new GatewayProvider({
        endpoint: gatewayEndpoint,
        accessToken: gatewayToken,
        provider: cloudProviderName,
      })
    : null;

export default function Home() {
  const [view, setView] = useState<View>('dashboard');
  const [menu, setMenu] = useState(false);
  const [dark, setDark] = useState(false);
  const [msgs, setMsgs] = useState<ChatMessage[]>([initial]);
  const [draft, setDraft] = useState('');
  const [turn, setTurn] = useState(1);
  const [toast, setToast] = useState('');
  const [catalogQuery, setCatalogQuery] = useState('');
  const [sending, setSending] = useState(false);
  const [aiMode, setAiMode] = useState<'scenario' | 'cloud' | 'fallback'>(
    'scenario',
  );
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);
  const result = useMemo(() => evaluateSession(msgs), [msgs]);
  const filteredProducts = useMemo(() => {
    const query = catalogQuery.trim().toLowerCase();
    if (!query) return demoProducts;
    return demoProducts.filter((product) =>
      [product.name, product.sku, product.category]
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [catalogQuery]);
  const notice = (s: string) => {
    setToast(s);
    setTimeout(() => setToast(''), 2200);
  };
  const start = () => {
    setMsgs([{ ...initial, at: Date.now() }]);
    setTurn(1);
    setAiMode('scenario');
    setView('training');
  };
  const send = async () => {
    if (!draft.trim() || sending) return;
    const s: ChatMessage = {
      role: 'seller',
      text: draft.trim(),
      at: Date.now(),
    };
    const next = [...msgs, s];
    setMsgs(next);
    setDraft('');
    setSending(true);

    let buyer = generateBuyerTurn(next, turn);
    if (cloudAI) {
      try {
        const cloudTurn = await cloudAI.generateBuyerTurn({
          language: 'ru',
          turn,
          messages: next.map(({ role, text }) => ({ role, text })),
          scenario: {
            buyer: 'Владелец автосервиса Андрей',
            goal: 'Выяснить потребность и договориться о тестовой поставке',
            product: {
              name: 'Колодки QF-Brake Pro',
              priceFrom: 3250,
              currency: 'RUB',
              minimumOrder: 4,
            },
          },
        });
        buyer = {
          role: 'buyer',
          text: cloudTurn.publicMessage,
          at: Date.now(),
          shouldEnd: cloudTurn.shouldEnd,
        };
        setAiMode('cloud');
      } catch {
        setAiMode('fallback');
        notice('Облачный ИИ недоступен — разговор продолжен офлайн.');
      }
    }

    setMsgs([...next, buyer]);
    setTurn((current) => current + 1);
    setSending(false);
  };

  const checkCloudAI = async () => {
    if (!cloudAI) {
      notice('Добавьте публичные настройки Supabase в переменные окружения.');
      return;
    }
    try {
      const status = await cloudAI.healthCheck();
      notice(
        status.available
          ? `${cloudProviderName === 'gemini' ? 'Gemini' : 'OpenRouter'} готов к работе`
          : 'Провайдер не настроен в Supabase',
      );
    } catch {
      notice('Не удалось связаться с AI-шлюзом');
    }
  };
  return (
    <main className="min-h-screen bg-[#f4f7fb] text-slate-900 dark:bg-[#08111f] dark:text-slate-100">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-white/10 bg-[#071b33] text-white transition-transform lg:translate-x-0 ${menu ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex h-20 items-center justify-between px-5">
          <button
            onClick={() => setView('dashboard')}
            className="flex items-center gap-3"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-emerald-400 text-[#071b33]">
              <Sparkles size={20} />
            </span>
            <b className="text-lg">
              Qraft <i className="not-italic text-emerald-300">Sales</i>
            </b>
          </button>
          <button
            aria-label="Закрыть меню"
            className="lg:hidden"
            onClick={() => setMenu(false)}
          >
            <X />
          </button>
        </div>
        <div className="mx-3 mb-4 flex items-center gap-3 rounded-xl bg-white/6 p-3">
          <Building2 size={18} />
          <div>
            <p className="text-sm font-semibold">Qraft Auto Parts</p>
            <p className="text-xs text-slate-400">Демо-компания</p>
          </div>
        </div>
        <nav className="space-y-1 px-3">
          {nav.map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => {
                setView(id);
                setMenu(false);
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${view === id ? 'bg-emerald-400 font-bold text-[#071b33]' : 'text-slate-300 hover:bg-white/8'}`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
        <div className="absolute inset-x-4 bottom-4 rounded-xl bg-white/6 p-3 text-xs text-slate-300">
          <p className="mb-1 flex items-center gap-2 text-emerald-300">
            <CloudOff size={14} />
            Офлайн-режим готов
          </p>
          Демо работает без API-ключа.
        </div>
      </aside>
      <div className="min-w-0 lg:pl-64">
        <header className="sticky top-0 z-30 flex h-18 items-center justify-between border-b bg-white/90 px-4 backdrop-blur dark:bg-[#0b1728]/90 sm:px-7">
          <div className="flex items-center gap-3">
            <button
              aria-label="Открыть меню"
              className="lg:hidden"
              onClick={() => setMenu(true)}
            >
              <Menu />
            </button>
            <div>
              <b>{nav.find((x) => x[0] === view)?.[1]}</b>
              <p className="hidden text-xs text-slate-500 sm:block">
                Практика реальных переговоров
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              aria-label="Язык интерфейса"
              onClick={() =>
                notice('KZ и EN находятся в roadmap. Текущая версия — RU.')
              }
              className="flex items-center gap-1 rounded-lg border px-2.5 py-2 text-xs font-bold"
            >
              <Languages size={15} />
              RU
            </button>
            <button
              aria-label={
                dark ? 'Включить светлую тему' : 'Включить тёмную тему'
              }
              onClick={() => setDark(!dark)}
              className="rounded-lg border p-2"
            >
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <span className="grid size-9 place-items-center rounded-full bg-[#173e6a] text-xs font-bold text-white">
              АК
            </span>
          </div>
        </header>
        <section className="mx-auto max-w-[1400px] p-4 sm:p-7">
          {content()}
        </section>
      </div>
      {menu && (
        <button
          aria-label="Закрыть меню"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMenu(false)}
        />
      )}{' '}
      {toast && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-[#071b33] px-4 py-3 text-sm text-white">
          {toast}
        </div>
      )}
    </main>
  );

  function content() {
    if (view === 'training') return <Training />;
    if (view === 'result') return <Result />;
    if (view === 'catalog') return <Catalog />;
    if (view === 'scripts') return <Scripts />;
    if (view === 'ai') return <AI />;
    if (view === 'scenarios') return <Cards />;
    if (view === 'analytics') return <Analytics />;
    if (view === 'team') return <Team />;
    if (view === 'rules') return <Rules />;
    return <Dashboard />;
  }
  function Head({
    title,
    sub,
    action,
  }: {
    title: string;
    sub: string;
    action?: React.ReactNode;
  }) {
    return (
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{sub}</p>
        </div>
        {action}
      </div>
    );
  }
  function Dashboard() {
    const skills = [
      ['Выявление потребностей', 78],
      ['Знание продукта', 86],
      ['Работа с возражениями', 64],
      ['Переговоры и маржа', 58],
      ['Закрытие продажи', 71],
    ] as const;
    return (
      <div className="space-y-5">
        <div className="rounded-2xl bg-[#0b2a4a] p-6 text-white">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-300">
                ПЕРСОНАЛЬНЫЙ ПЛАН
              </span>
              <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
                Потренируем работу со скидкой?
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Покупатель сравнит с конкурентом и потребует снижения цены.
                Сохраните маржу и договоритесь о следующем шаге.
              </p>
            </div>
            <button
              onClick={start}
              className="flex justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 font-bold text-[#071b33]"
            >
              <Play size={18} fill="currentColor" />
              Начать тренировку
            </button>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ['Уровень', 'Уверенный продавец'],
            ['Тренировок', '24'],
            ['Средний балл', '76 / 100'],
            ['Серия', '6 дней'],
          ].map((x, i) => (
            <div
              key={x[0]}
              className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-[#0e1c2e]"
            >
              <p className="text-sm text-slate-500">{x[0]}</p>
              <p className="mt-2 text-2xl font-bold">{x[1]}</p>
              <p className="mt-2 text-xs text-emerald-600">
                {i === 1 ? '5 на этой неделе' : '↑ прогресс'}
              </p>
            </div>
          ))}
        </div>
        <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
          <div className="rounded-2xl border bg-white p-5 dark:bg-[#0e1c2e]">
            <h3 className="font-bold">Профиль навыков</h3>
            <p className="text-sm text-slate-500">Последние 10 тренировок</p>
            <div className="mt-5 space-y-4">
              {skills.map(([s, v]) => (
                <div key={s}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{s}</span>
                    <b>{v}</b>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full ${v < 65 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                      style={{ width: `${v}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border bg-white p-5 dark:bg-[#0e1c2e]">
            <h3 className="font-bold">Фокус развития</h3>
            <p className="text-sm text-slate-500">
              3 точки роста от ИИ-тренера
            </p>
            <div className="mt-4 space-y-3">
              {[
                'Не предлагайте скидку до выяснения объёма',
                'Фиксируйте конкретный следующий шаг',
                'Спросите о текущем поставщике',
              ].map((x, i) => (
                <div
                  key={x}
                  className="flex gap-3 rounded-xl bg-slate-50 p-3 text-sm dark:bg-white/5"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-amber-100 text-xs font-bold text-amber-800">
                    {i + 1}
                  </span>
                  {x}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  function Training() {
    return (
      <div>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">
              ТРЕНИРОВКА
            </span>
            <h2 className="mt-2 text-xl font-bold">Владелец автосервиса</h2>
          </div>
          <button
            onClick={() => setView('result')}
            className="rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-600"
          >
            Завершить
          </button>
        </div>
        <div className="grid min-h-[680px] overflow-hidden rounded-2xl border bg-white dark:bg-[#0e1c2e] lg:grid-cols-[1fr_290px]">
          <div className="flex flex-col">
            <div className="border-b p-4">
              <b>
                Андрей • {aiMode === 'cloud' ? 'облачный ИИ' : 'сценарный ИИ'}
              </b>
              <p className="text-xs text-emerald-600">
                {sending
                  ? 'печатает…'
                  : aiMode === 'fallback'
                    ? 'офлайн-резерв'
                    : 'в сети'}
              </p>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-4 dark:bg-[#091625]">
              {msgs.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === 'seller' ? 'justify-end' : ''}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm sm:max-w-[70%] ${m.role === 'seller' ? 'rounded-br-md bg-[#173e6a] text-white' : 'rounded-bl-md border bg-white dark:bg-[#122238]'}`}
                  >
                    {m.text}
                    <span className="mt-1 block text-[10px] opacity-60">
                      {new Date(m.at).toLocaleTimeString('ru', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t p-3">
              <button
                onClick={() =>
                  notice(
                    'Подсказка: уточните месячный объём и критерии выбора.',
                  )
                }
                className="mb-2 text-xs font-bold text-amber-700"
              >
                ? Подсказка 1/2
              </button>
              <div className="flex gap-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void send();
                    }
                  }}
                  disabled={sending}
                  className="min-h-12 flex-1 resize-none rounded-xl border bg-transparent p-3 text-sm"
                  placeholder="Ответ покупателю…"
                />
                <button
                  onClick={() => void send()}
                  disabled={sending || !draft.trim()}
                  aria-label="Отправить ответ"
                  className="grid size-12 place-items-center rounded-xl bg-emerald-400 text-[#071b33] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sending ? (
                    <LoaderCircle className="animate-spin" size={19} />
                  ) : (
                    <Send size={19} />
                  )}
                </button>
              </div>
            </div>
          </div>
          <aside className="hidden border-l p-5 lg:block">
            <p className="text-xs font-bold uppercase text-slate-400">Цель</p>
            <p className="mt-2 text-sm font-semibold">
              Выяснить потребность и договориться о тестовой поставке
            </p>
            <hr className="my-5" />
            <p className="text-xs font-bold uppercase text-slate-400">Этапы</p>
            <div className="mt-3 space-y-3">
              {[
                'Контакт',
                'Потребности',
                'Презентация',
                'Возражения',
                'Закрытие',
              ].map((x, i) => (
                <p
                  key={x}
                  className={`text-sm ${i === Math.min(4, Math.floor(turn / 2)) ? 'font-bold text-blue-700' : 'text-slate-500'}`}
                >
                  <span className="mr-2 inline-grid size-6 place-items-center rounded-full bg-slate-100 text-xs dark:bg-slate-800">
                    {i + 1}
                  </span>
                  {x}
                </p>
              ))}
            </div>
            <hr className="my-5" />
            <p className="text-xs font-bold uppercase text-slate-400">Товар</p>
            <div className="mt-2 rounded-xl bg-slate-50 p-3 text-sm dark:bg-white/5">
              <b>Колодки QF-Brake Pro</b>
              <p className="text-xs text-slate-500">от 3 250 ₽ • MOQ 4</p>
            </div>
          </aside>
        </div>
      </div>
    );
  }
  function Result() {
    return (
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="rounded-2xl bg-[#0b2a4a] p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-emerald-300">Тренировка завершена</span>
              <h2 className="text-2xl font-bold">{result.outcome}</h2>
              <p className="mt-2 text-sm text-slate-300">
                Баллы начислены только при наличии доказательств.
              </p>
            </div>
            <div className="grid size-24 place-items-center rounded-full border-8 border-emerald-400">
              <b className="text-3xl">{result.total}</b>
            </div>
          </div>
        </div>
        <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
          <div className="rounded-2xl border bg-white p-5 dark:bg-[#0e1c2e]">
            <h3 className="font-bold">Оценка навыков</h3>
            <div className="mt-4 space-y-4">
              {result.criteria.map((c) => (
                <div key={c.name}>
                  <div className="flex justify-between text-sm">
                    <span>{c.name}</span>
                    <b>
                      {c.score}/{c.max}
                    </b>
                  </div>
                  <div className="my-1 h-2 rounded bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded bg-emerald-500"
                      style={{ width: `${(c.score / c.max) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500">{c.evidence}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border bg-white p-5 dark:bg-[#0e1c2e]">
            <h3 className="font-bold">3 точки роста</h3>
            <div className="mt-4 space-y-4">
              {result.weaknesses.map((x, i) => (
                <div key={x} className="flex gap-3 text-sm">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-800">
                    {i + 1}
                  </span>
                  {x}
                </div>
              ))}
            </div>
            <button
              onClick={() => setView('scripts')}
              className="mt-6 w-full rounded-xl bg-emerald-400 py-3 font-bold text-[#071b33]"
            >
              Персональные скрипты
            </button>
          </div>
        </div>
      </div>
    );
  }
  function Catalog() {
    return (
      <>
        <Head
          title="Каталог товаров"
          sub="Демо-каталог оптового поставщика"
          action={
            <div className="flex gap-2">
              <span className="cursor-not-allowed rounded-xl border px-4 py-2 text-sm font-bold opacity-60">
                <FileUp className="mr-1 inline" size={16} />
                Импорт — roadmap
              </span>
              <button
                disabled
                title="Добавление товаров появится после подключения Supabase"
                className="cursor-not-allowed rounded-xl bg-[#173e6a] px-4 py-2 text-sm font-bold text-white opacity-60"
              >
                <Plus className="mr-1 inline" size={16} />
                Товар — roadmap
              </button>
            </div>
          }
        />
        <div className="mb-4 flex items-center gap-2 rounded-xl border bg-white px-3 dark:bg-[#0e1c2e]">
          <Search size={17} />
          <input
            value={catalogQuery}
            onChange={(event) => setCatalogQuery(event.target.value)}
            className="w-full bg-transparent py-3 text-sm outline-none"
            placeholder="Поиск по SKU или названию"
          />
        </div>
        <div className="overflow-x-auto rounded-2xl border bg-white dark:bg-[#0e1c2e]">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-white/5">
              <tr>
                {['Товар', 'SKU', 'Категория', 'Цена', 'MOQ', 'Статус'].map(
                  (x) => (
                    <th className="px-4 py-3" key={x}>
                      {x}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr key={p.sku} className="border-t">
                  <td className="px-4 py-4 font-semibold">{p.name}</td>
                  <td className="px-4 font-mono text-xs">{p.sku}</td>
                  <td className="px-4 text-slate-500">{p.category}</td>
                  <td className="px-4 font-semibold">
                    {p.price.toLocaleString('ru')} ₽
                  </td>
                  <td className="px-4">{p.moq}</td>
                  <td className="px-4">
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-800">
                      В наличии
                    </span>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-slate-500"
                    colSpan={6}
                  >
                    Ничего не найдено
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </>
    );
  }
  function Cards() {
    return (
      <>
        <Head
          title="Библиотека сценариев"
          sub="Практика конкретных навыков"
          action={
            <button
              disabled
              title="Конструктор сценариев находится в roadmap"
              className="cursor-not-allowed rounded-xl bg-[#173e6a] px-4 py-2 text-sm font-bold text-white opacity-60"
            >
              <Plus className="mr-1 inline" size={16} />
              Создать — roadmap
            </button>
          }
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[
            'Сравнение с конкурентом',
            'Жёсткие переговоры о скидке',
            'Возвращение клиента',
            'Товар отсутствует',
            'Холодный звонок',
            'Просьба об отсрочке',
          ].map((x, i) => (
            <div
              className="rounded-2xl border bg-white p-5 dark:bg-[#0e1c2e]"
              key={x}
            >
              <Target className="text-blue-700" />
              <h3 className="mt-4 font-bold">{x}</h3>
              <p className="mt-1 text-sm text-slate-500">
                {i % 2 ? 'Закупщик' : 'Владелец автосервиса'} •{' '}
                {i > 2 ? 'Сложный' : 'Стандартный'}
              </p>
              <button
                onClick={i === 0 ? start : undefined}
                disabled={i !== 0}
                className="mt-5 flex items-center text-sm font-bold text-blue-700 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                {i === 0 ? 'Запустить' : 'Roadmap'} <ChevronRight size={16} />
              </button>
            </div>
          ))}
        </div>
      </>
    );
  }
  function Scripts() {
    return (
      <>
        <Head
          title="Персональные скрипты"
          sub="Формулировки по вашим слабым навыкам"
        />
        <div className="rounded-2xl border bg-white p-5 dark:bg-[#0e1c2e]">
          <span className="text-xs font-bold text-red-500">
            ПРОБЛЕМНАЯ ФРАЗА
          </span>
          <blockquote className="mt-2 rounded-xl bg-red-50 p-4 text-sm text-red-900 dark:bg-red-950/30 dark:text-red-100">
            «Можем попробовать дать ещё 7% скидки»
          </blockquote>
          <p className="mt-3 text-sm text-slate-500">
            Скидка предложена до выяснения объёма и без встречного условия.
          </p>
          <h3 className="mt-6 font-bold">Улучшенные варианты</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {[
              [
                'Мягко',
                'Давайте уточним объём — тогда предложу оптимальные условия.',
              ],
              [
                'По-деловому',
                'При заказе от 20 комплектов действует следующий ценовой уровень.',
              ],
              [
                'Уверенно',
                'Снижать цену без изменения условий не готов. Предложу аналог.',
              ],
            ].map((x) => (
              <div className="rounded-xl border p-4" key={x[0]}>
                <b className="text-sm text-blue-700">{x[0]}</b>
                <p className="mt-2 text-sm">{x[1]}</p>
              </div>
            ))}
          </div>
          <button
            onClick={start}
            className="mt-5 rounded-xl bg-emerald-400 px-4 py-3 font-bold text-[#071b33]"
          >
            Закрепить в упражнении
          </button>
        </div>
      </>
    );
  }
  function Analytics() {
    return (
      <>
        <Head title="Аналитика обучения" sub="Динамика за 8 недель" />
        <p className="-mt-3 mb-5 text-xs text-slate-500">
          Ниже показаны демонстрационные данные. История появится после
          подключения Supabase.
        </p>
        <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
          <div className="rounded-2xl border bg-white p-5 dark:bg-[#0e1c2e]">
            <h3 className="font-bold">Средний балл</h3>
            <div className="mt-6 flex h-52 items-end gap-3">
              {[58, 61, 64, 62, 69, 72, 74, 78].map((v, i) => (
                <div
                  className="flex flex-1 flex-col items-center gap-2"
                  key={i}
                >
                  <b className="text-xs">{v}</b>
                  <div
                    className="w-full rounded-t bg-blue-600"
                    style={{ height: v * 1.9 }}
                  />
                  <span className="text-[10px] text-slate-400">{i + 1}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border bg-white p-5 dark:bg-[#0e1c2e]">
            <h3 className="font-bold">Частые ошибки</h3>
            {[
              ['Ранняя скидка', 42],
              ['Нет следующего шага', 35],
              ['Мало вопросов', 29],
            ].map((x) => (
              <div className="mt-5" key={x[0]}>
                <div className="flex justify-between text-sm">
                  <span>{x[0]}</span>
                  <b>{x[1]}%</b>
                </div>
                <div className="mt-1 h-2 rounded bg-slate-100">
                  <div
                    className="h-full rounded bg-amber-400"
                    style={{ width: `${x[1]}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }
  function Team() {
    return (
      <>
        <Head
          title="Команда продаж"
          sub="Демонстрационные результаты и назначения"
          action={
            <button
              disabled
              title="Приглашения появятся после подключения Supabase Auth"
              className="cursor-not-allowed rounded-xl bg-[#173e6a] px-4 py-2 text-sm font-bold text-white opacity-60"
            >
              <Plus className="mr-1 inline" size={16} />
              Пригласить — roadmap
            </button>
          }
        />
        <div className="overflow-x-auto rounded-2xl border bg-white dark:bg-[#0e1c2e]">
          <table className="w-full min-w-[650px] text-sm">
            <tbody>
              {[
                ['Анна Ким', 'Продавец', '24', '78'],
                ['Руслан Алиев', 'Продавец', '18', '72'],
                ['Мария Орлова', 'Руководитель', '31', '84'],
                ['Данияр Садыков', 'Продавец', '9', '65'],
              ].map((r) => (
                <tr className="border-b" key={r[0]}>
                  <td className="px-4 py-5 font-bold">{r[0]}</td>
                  <td>{r[1]}</td>
                  <td>{r[2]} тренировок</td>
                  <td className="font-bold">{r[3]} / 100</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }
  function Rules() {
    return (
      <>
        <Head
          title="Правила продаж"
          sub="Ограничивают обещания ИИ и рекомендации"
        />
        <div className="grid gap-4 md:grid-cols-2">
          {[
            [
              'Целевая аудитория',
              'Автосервисы, магазины, корпоративные автопарки',
            ],
            ['Условия оплаты', '100% предоплата; отсрочка после 3 заказов'],
            ['Доставка', 'Москва 1–2 дня; регионы — транспортной компанией'],
            ['Скидки', 'До 3% продавец; до 7% руководитель'],
            ['Обязательные вопросы', 'Тип бизнеса, объём, поставщик, критерии'],
            [
              'Запрещённые обещания',
              'Не обещать ресурс и наличие без проверки',
            ],
          ].map((x) => (
            <label
              className="rounded-2xl border bg-white p-4 dark:bg-[#0e1c2e]"
              key={x[0]}
            >
              <b className="text-sm">{x[0]}</b>
              <textarea
                className="mt-2 min-h-20 w-full rounded-lg border bg-transparent p-3 text-sm"
                defaultValue={x[1]}
              />
            </label>
          ))}
        </div>
        <button
          disabled
          title="Сохранение появится после подключения Supabase"
          className="mt-5 cursor-not-allowed rounded-xl bg-emerald-400 px-5 py-3 font-bold text-[#071b33] opacity-60"
        >
          Сохранение — roadmap
        </button>
      </>
    );
  }
  function AI() {
    const configuredName =
      cloudProviderName === 'gemini' ? 'Gemini' : 'OpenRouter';
    const cards = [
      ['Сценарный движок', 'Подключён', 'Работает офлайн'],
      [
        'Gemini',
        cloudAI && cloudProviderName === 'gemini' ? 'Настроен' : 'Не настроен',
        'Supabase Edge Function',
      ],
      [
        'OpenRouter',
        cloudAI && cloudProviderName === 'openrouter'
          ? 'Настроен'
          : 'Не настроен',
        'Free router / :free',
      ],
      ['Cloudflare AI', 'Roadmap', 'Серверный адаптер'],
      ['Ollama', 'Roadmap', 'Локальный сервер'],
      ['WebLLM', 'Roadmap', 'Требуется WebGPU'],
    ];

    return (
      <>
        <Head
          title="Настройки ИИ"
          sub="Безопасный шлюз и резервный сценарный режим"
        />
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          <b>Не загружайте коммерческие тайны в бесплатные модели.</b> Для
          чувствительных данных используйте Ollama или WebLLM.
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((x, i) => (
            <div
              className={`rounded-2xl border bg-white p-5 dark:bg-[#0e1c2e] ${i === 0 ? 'border-emerald-400' : ''}`}
              key={x[0]}
            >
              <div className="flex justify-between">
                <Bot className="text-blue-700" />
                <span
                  className={`rounded-full px-2 py-1 text-xs ${i === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}
                >
                  {x[1]}
                </span>
              </div>
              <h3 className="mt-4 font-bold">{x[0]}</h3>
              <p className="text-sm text-slate-500">{x[2]}</p>
              <button
                onClick={() => {
                  if (i === 0) notice('Офлайн-движок исправен');
                  else if (x[0] === configuredName) void checkCloudAI();
                  else if (x[1] === 'Roadmap')
                    notice('Этот адаптер запланирован в roadmap');
                  else notice('Выберите провайдера в переменных окружения');
                }}
                className="mt-4 rounded-lg border px-3 py-2 text-sm font-bold"
              >
                Проверить
              </button>
            </div>
          ))}
        </div>
      </>
    );
  }
}
