# Tretyakov Audio — TTS-аудиогид по картинам Третьяковской галереи

Frontend-приложение на React: каталог произведений, поиск, фильтры, detail с аудио-описанием (OGG)
и QR-сканирование для мгновенного перехода к картине в музее.

Главный сценарий: **QR-код → detail → Play → слушать аудиогид**.

## Стек

- React 19 + TypeScript (strict) + Vite
- Tailwind CSS v4 + shadcn/ui (new-york, neutral)
- React Router, TanStack Query
- `html5-qrcode` для сканирования (плюс ручной ввод URL как fallback)
- Playwright для E2E smoke-тестов

## Запуск

```bash
npm install
cp .env.example .env   # указать URL backend
npm run dev
```

```bash
npm run build
npm run preview
```

## Environment

```env
VITE_API_BASE_URL=http://localhost:8000
```

Backend URL используется только через `VITE_API_BASE_URL` (`src/api/client.ts`).
Никаких захардкоженных URL и секретов во frontend нет.

## API

| Метод  | Endpoint                                                                                         | Назначение           |
| ------ | ------------------------------------------------------------------------------------------------ | -------------------- |
| `GET`  | `/api/v1/artworks?q&author_id[]&style_id[]&material_id[]&technique_id[]&period[]&page&page_size` | каталог              |
| `GET`  | `/api/v1/artworks/{id}?with_audio&speaker`                                                       | detail картины       |
| `POST` | `/api/v1/artworks/find?with_audio&speaker` `{url}`                                               | поиск по QR URL      |
| `GET`  | `/api/v1/filters`                                                                                | фильтры (кешируются) |
| `GET`  | `/api/v1/artworks/{id}/audio?voice`                                                              | streaming аудио      |

QR URL передаётся backend целиком — frontend не парсит ID из URL.

## Маршруты

- `/` — главная (CTA «Сканировать QR-код», поиск, превью каталога)
- `/artworks` — каталог (поиск с debounce 400мс, фильтры в Sheet, пагинация; состояние в URL)
- `/artworks/:id` — detail (галерея, аудиоплеер, выбор голоса, описание, факты, характеристики)
- `/scan` — QR-сканер (камера + ручной ввод ссылки)

## Аудио

- Один `HTMLAudioElement` на приложение (`AudioPlayerProvider`): два трека одновременно невозможны.
- `preload="none"` — аудио не грузится до нажатия Play.
- Play/Pause, seek, ±15с, громкость, mute, скорость 0.75–2x, loading/error/disabled состояния.
- Sticky mini-player при прослушивании.
- `detail` грузится с `with_audio=false`; генерация — только по кнопке «Слушать аудиогид».

## Проверки

```bash
npm run build        # TypeScript + production build
npm run lint         # ESLint + oxlint
npm run format:check # Prettier
npx playwright install --with-deps chromium
npm run test:e2e     # каталог, detail, поиск, фильтр, QR-flow, аудио
```

E2E используют `page.route` моки, повторяющие реальные response shapes (без отдельного mock-backend).
QR-тест не требует камеры: используется ручной ввод URL.
