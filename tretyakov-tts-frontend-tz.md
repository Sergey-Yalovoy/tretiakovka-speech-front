# ТЗ для frontend-разработки TTS-аудиогида по картинам Третьяковской галереи

## 1. Цель проекта

Разработать frontend-приложение на React для мобильного и desktop использования.

Приложение предоставляет пользователю каталог произведений искусства Третьяковской галереи с возможностью:

- просматривать список картин;
- искать картины;
- фильтровать каталог;
- открывать детальную информацию о картине;
- сканировать QR-код с URL картины и сразу переходить на detail;
- воспроизводить аудио-описание картины в формате OGG;
- использовать изображение картины как обложку аудиоплеера;
- работать с аудио как с полноценным медиаплеером;
- корректно работать на мобильных устройствах;
- сохранять удобство использования на desktop.

Главный пользовательский сценарий:

> Пользователь находится в галерее → наводит камеру на QR-код → приложение распознаёт URL → находит произведение → открывает detail → пользователь нажимает Play → слушает аудиогид.

Frontend должен быть максимально простым для пользователя. Не нужно превращать приложение в сложную административную систему.

---

# 2. Стек

Обязательный стек:

- React
- TypeScript
- Vite
- shadcn/ui
- Tailwind CSS
- React Router
- Context7 для получения актуальной документации библиотек во время разработки
- Playwright для E2E/браузерных проверок

Допускается использовать небольшие дополнительные библиотеки, если они реально упрощают задачу.

Перед добавлением новой зависимости необходимо проверить:

1. нельзя ли решить задачу средствами браузера;
2. нельзя ли решить задачу уже установленными библиотеками;
3. насколько библиотека актуальна;
4. насколько она подходит для mobile;
5. не создаёт ли она существенное усложнение проекта.

Не использовать тяжёлые UI-фреймворки поверх shadcn/ui.

---

# 3. Главные принципы разработки

## 3.1 Mobile First

Основной пользователь — человек со смартфоном непосредственно в музее.

Приоритет:

1. mobile;
2. tablet;
3. desktop.

Интерфейс должен быть удобен одной рукой.

Минимальная целевая ширина:

- 320px.

Основная тестовая ширина:

- 375px;
- 390px;
- 430px.

Desktop должен выглядеть аккуратно, но не должен диктовать архитектуру интерфейса.

---

## 3.2 Не усложнять

Это не enterprise frontend.

Не нужны:

- Redux без необходимости;
- сложная design system;
- десятки глобальных компонентов;
- сложная абстракция API;
- GraphQL;
- SSR;
- Next.js;
- backend logic во frontend.

Backend уже существует и предоставляется через REST API.

---

## 3.3 Типизация

TypeScript использовать строго.

Запрещается массово использовать:

```ts
any
```

Если API-ответ требует особого преобразования, создать нормальный тип/adapter.

API-модели должны соответствовать OpenAPI.

---

# 4. Backend API

Base URL должен быть вынесен в environment variable.

Например:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Не хардкодить URL backend внутри компонентов.

---

# 5. API endpoints

## 5.1 Получение списка картин

```http
GET /api/v1/artworks
```

Query parameters:

```text
q
author_id[]
style_id[]
material_id[]
technique_id[]
period[]
page
page_size
```

Пример:

```text
/api/v1/artworks?q=Толстой&author_id=123&style_id=4&page=1&page_size=20
```

Backend возвращает:

```json
{
  "total": 100,
  "page": 1,
  "page_size": 20,
  "items": []
}
```

---

# 6. Detail картины

```http
GET /api/v1/artworks/{artwork_id}
```

Query:

```text
with_audio
speaker
```

Пример:

```text
/api/v1/artworks/8395?with_audio=false&speaker=baya
```

Response:

```json
{
  "id": 8395,
  "name": "...",
  "code": "...",
  "authors": [],
  "styles": [],
  "height": "...",
  "width": "...",
  "depth": "...",
  "creat": "...",
  "creat_f": "...",
  "period": "...",
  "picture_big": [],
  "picture_thumb": [],
  "has_audio": true,
  "audio_url": "...",
  "placement": "...",
  "materials": [],
  "techniques": [],
  "facts": "...",
  "description": "..."
}
```

---

# 7. Поиск картины по QR URL

```http
POST /api/v1/artworks/find
```

Body:

```json
{
  "url": "https://my.tretyakov.ru/app/masterpiece/8395"
}
```

Query:

```text
with_audio
speaker
```

Это основной endpoint QR-сценария.

После успешного сканирования:

1. получить URL;
2. отправить URL на `/api/v1/artworks/find`;
3. получить `ArtworkDetailResponse`;
4. открыть detail экран;
5. не показывать пользователю промежуточную страницу поиска.

---

# 8. Фильтры

```http
GET /api/v1/filters
```

Response:

```json
{
  "authors": [],
  "styles": [],
  "materials": [],
  "techniques": [],
  "periods": []
}
```

Backend кеширует эти данные в Redis.

Frontend тоже должен держать фильтры в памяти приложения и не запрашивать `/filters` повторно без необходимости.

---

# 9. Audio

Основной источник:

```text
ArtworkDetailResponse.audio_url
```

Если `audio_url` существует — использовать его для HTML5 audio.

Также существует endpoint:

```http
GET /api/v1/artworks/{artwork_id}/audio
```

Query:

```text
voice
```

Endpoint предназначен для streaming/caching backend.

Важно:

Frontend не должен самостоятельно решать, находится ли файл на диске или S3.

Для frontend источник аудио — URL, который предоставляет backend.

Если backend отдаёт S3 URL, использовать его напрямую.

Если backend отдаёт `/api/v1/artworks/{id}/audio`, использовать этот URL.

---

# 10. Формат аудио

Основной формат:

```text
OGG
```

Использовать HTML5:

```html
<audio>
```

Но не полагаться на браузерный native UI.

Нужен собственный полноценный audio player.

---

# 11. Архитектура приложения

Предлагаемая структура:

```text
src/
├── app/
│   ├── App.tsx
│   ├── router.tsx
│   └── providers/
│
├── api/
│   ├── client.ts
│   ├── artworks.ts
│   ├── filters.ts
│   └── types.ts
│
├── components/
│   ├── ui/
│   ├── artwork/
│   ├── audio/
│   ├── filters/
│   ├── qr/
│   └── layout/
│
├── features/
│   ├── artwork-list/
│   ├── artwork-detail/
│   ├── artwork-search/
│   ├── qr-scanner/
│   └── audio-player/
│
├── pages/
│   ├── HomePage.tsx
│   ├── ArtworkListPage.tsx
│   ├── ArtworkDetailPage.tsx
│   ├── QRScannerPage.tsx
│   └── NotFoundPage.tsx
│
├── hooks/
│
├── lib/
│
├── types/
│
├── assets/
│
└── main.tsx
```

Структуру можно немного изменить, если в процессе разработки появляется более очевидный вариант.

Не создавать искусственные abstraction layers.

---

# 12. Routing

Использовать React Router.

Минимальные маршруты:

```text
/
```

Главный экран / каталог.

```text
/artworks
```

Каталог с фильтрами.

```text
/artworks/:id
```

Detail картины.

```text
/scan
```

QR scanner.

```text
/search
```

Можно не создавать отдельную страницу search, если поиск является частью `/artworks`.

Предпочтительный вариант:

```text
/artworks?q=...
```

---

# 13. Главная страница

Главная должна сразу объяснять назначение приложения.

Примерная структура:

```text
┌─────────────────────────────┐
│       Tretyakov Audio       │
│                             │
│  Слушайте истории картин    │
│                             │
│  ┌───────────────────────┐  │
│  │     📷 Сканировать    │  │
│  │        QR-код         │  │
│  └───────────────────────┘  │
│                             │
│  🔎 Найти картину            │
│                             │
│  Популярные / каталог        │
│                             │
│  [карточки картин]           │
└─────────────────────────────┘
```

Главный CTA:

```text
Сканировать QR-код
```

должен быть визуально самым заметным действием.

---

# 14. Нижняя навигация mobile

На mobile желательно использовать bottom navigation.

Например:

```text
┌─────────────────────────────┐
│                             │
│          CONTENT            │
│                             │
├─────────────────────────────┤
│ 🏠 Главная │ 🔎 Каталог │ 📷 QR │
└─────────────────────────────┘
```

Количество элементов — минимальное.

Не делать navigation bar перегруженным.

---

# 15. Каталог

Страница:

```text
/artworks
```

Содержит:

1. поиск;
2. кнопку фильтров;
3. список картин;
4. пагинацию или infinite scroll.

Для mobile предпочтительнее infinite scroll, но если это усложняет реализацию — использовать обычную пагинацию.

Первый вариант для реализации:

> pagination.

После того как приложение работает, можно заменить на infinite scroll.

---

# 16. Поиск

Поле:

```text
Найти картину или автора
```

Использует:

```text
GET /api/v1/artworks?q=...
```

Не отправлять запрос на каждый введённый символ.

Использовать debounce примерно:

```text
300–500 ms
```

Либо выполнять поиск после submit.

Для mobile предпочтительно debounce.

---

# 17. Фильтры

Фильтры должны открываться через Sheet/Drawer.

Использовать shadcn/ui `Sheet`.

На mobile:

```text
[Фильтры]
```

открывает нижнюю/боковую панель.

Внутри:

```text
Авторы
Стили
Материалы
Техники
Период
```

Для multi-select использовать удобные checkbox/list controls.

Внизу:

```text
Сбросить
Применить
```

Не перегружать экран множеством select.

---

# 18. Artwork Card

Карточка картины должна содержать:

- thumbnail;
- название;
- автор;
- год/период;
- небольшой audio indicator, если `has_audio=true`.

Пример:

```text
┌───────────────────────────┐
│                           │
│        IMAGE              │
│                           │
├───────────────────────────┤
│ Иванов                     │
│ Явление Христа народу      │
│ 1837–1857                  │
│                    🔊      │
└───────────────────────────┘
```

Клик по карточке:

```text
/artworks/{id}
```

---

# 19. Detail screen

Это самый важный экран приложения.

Приоритет информации:

1. изображение;
2. название;
3. автор;
4. аудиоплеер;
5. краткая информация;
6. описание;
7. факты;
8. технические характеристики;
9. место размещения.

---

# 20. Detail mobile layout

Рекомендуемый порядок:

```text
← Назад

┌─────────────────────────────┐
│                             │
│       IMAGE / GALLERY       │
│                             │
└─────────────────────────────┘

Название картины

Автор
Период

┌─────────────────────────────┐
│ ▶  Аудиогид                 │
│                             │
│ ━━━━━━━━━━━━━━━●━━━━        │
│ 01:32              08:45    │
│                             │
│       ◀  ▶  ▶              │
└─────────────────────────────┘

Описание

Факты

Характеристики

Материалы

Техника

Место размещения
```

---

# 21. Изображение картины

Использовать:

```text
picture_big
```

для detail.

Использовать:

```text
picture_thumb
```

для списка.

Если `picture_big` содержит несколько изображений, реализовать простой gallery/carousel.

Не делать сложную фотогалерею на первом этапе.

Минимально:

- основное изображение;
- thumbnails;
- swipe на mobile.

---

# 22. Изображение как обложка аудиоплеера

Аудиоплеер должен визуально использовать изображение картины.

Например:

```text
┌─────────────────────────────┐
│  [IMAGE]                    │
│                             │
│  Аудиогид                   │
│  Название картины           │
│                             │
│  ━━━━━━━━━━━●━━━━━━         │
│                             │
│       ◀   ▶   ▶             │
└─────────────────────────────┘
```

Не использовать тяжёлые визуальные эффекты.

Можно сделать лёгкий blur/background image, если это хорошо выглядит.

---

# 23. Audio Player

Это ключевой UI-компонент.

Нужны:

- Play/Pause;
- progress bar;
- current time;
- duration;
- seek;
- volume;
- mute;
- playback speed;
- loading state;
- error state;
- disabled state;
- возможность продолжить после паузы.

Playback speed:

```text
0.75x
1x
1.25x
1.5x
2x
```

На mobile volume control может быть спрятан в дополнительное меню, поскольку системная громкость обычно удобнее.

---

# 24. Audio Player UX

Состояния:

### Idle

```text
▶ Слушать аудиогид
```

### Loading

```text
⏳ Загрузка...
```

### Playing

```text
⏸
```

### Paused

```text
▶
```

### Error

```text
Не удалось загрузить аудио
Повторить
```

---

# 25. Sticky Mini Player

После запуска аудио желательно показывать mini-player в нижней части экрана.

Например:

```text
┌─────────────────────────────┐
│ [thumb] Название       ⏸    │
│ ━━━━━━━━━━━━━●━━━━━━        │
└─────────────────────────────┘
```

Он позволяет:

- продолжать слушать аудио;
- переходить обратно на detail;
- управлять Play/Pause.

Mini-player особенно полезен при чтении длинного описания.

Если реализация начинает значительно усложнять приложение, mini-player сделать вторым этапом после основного player.

---

# 26. Audio URL

Логика:

```text
if artwork.audio_url:
    use artwork.audio_url
else:
    audio unavailable
```

Не генерировать URL самостоятельно.

Не предполагать структуру S3.

---

# 27. QR Scanner

Маршрут:

```text
/scan
```

Основной UX:

```text
┌─────────────────────────────┐
│ ← Сканировать QR            │
│                             │
│       CAMERA PREVIEW        │
│                             │
│      ┌─────────────┐        │
│      │             │        │
│      │   SCAN      │        │
│      │   AREA      │        │
│      │             │        │
│      └─────────────┘        │
│                             │
│ Наведите камеру на QR-код   │
└─────────────────────────────┘
```

---

# 28. QR Scanner implementation

Сначала проверить возможности современных браузеров.

Нужен QR scanning с использованием камеры.

Допустимо использовать библиотеку для QR decoding.

При выборе библиотеки:

- проверить актуальную документацию через Context7;
- проверить mobile Safari;
- проверить Chrome Android;
- проверить permission flow;
- проверить HTTPS requirement;
- проверить обработку отказа в доступе к камере.

Не писать собственный QR decoder.

---

# 29. QR workflow

После обнаружения QR:

```text
QR
 ↓
URL
 ↓
POST /api/v1/artworks/find
 ↓
ArtworkDetailResponse
 ↓
navigate /artworks/{id}
```

Важно:

не делать:

```text
QR → открыть внешний URL в браузере
```

QR URL используется как идентификатор для backend.

---

# 30. Проверка QR URL

Frontend не должен самостоятельно парсить ID картины из URL.

Например, URL:

```text
https://my.tretyakov.ru/app/masterpiece/8395
```

нужно передать backend целиком:

```json
{
  "url": "https://my.tretyakov.ru/app/masterpiece/8395"
}
```

Backend сам определяет картину.

---

# 31. Ошибки QR

Если QR считан, но backend не нашёл картину:

```text
Не удалось найти произведение

Попробуйте отсканировать QR-код ещё раз.
```

Кнопки:

```text
Повторить
В каталог
```

Если QR вообще не является поддерживаемой ссылкой:

```text
Этот QR-код не содержит ссылки на произведение Третьяковской галереи.
```

---

# 32. Camera permissions

При первом запуске scanner:

```text
Разрешите доступ к камере,
чтобы сканировать QR-коды произведений.
```

Если permission denied:

```text
Нет доступа к камере.

Разрешите доступ к камере в настройках браузера.
```

Не пытаться бесконечно запрашивать permission.

---

# 33. Loading states

Каждый API-запрос должен иметь loading state.

Не показывать пустой белый экран.

Использовать shadcn Skeleton.

Например для карточки:

```text
┌─────────────────┐
│ ███████████████ │
│ ███████████████ │
│ █████████       │
└─────────────────┘
```

---

# 34. Empty states

Если каталог пуст:

```text
Ничего не найдено

Попробуйте изменить параметры поиска или фильтры.
```

Если нет аудио:

```text
Аудиогид пока недоступен.
```

Если нет изображения:

```text
Изображение недоступно.
```

---

# 35. API client

Создать единый API client.

Например:

```ts
apiClient.get(...)
apiClient.post(...)
```

Не делать `fetch()` непосредственно в React-компонентах.

API слой должен отвечать только за HTTP.

Примерная структура:

```text
api/
├── client.ts
├── artworks.ts
├── filters.ts
└── types.ts
```

---

# 36. Data fetching

Можно использовать TanStack Query, если она ещё не установлена и её добавление оправдано.

Предпочтительно использовать её для:

- cache;
- loading;
- error;
- refetch;
- pagination;
- detail queries.

Если TanStack Query используется, не создавать поверх неё дополнительный самописный cache.

---

# 37. Cache

Особенно кешировать:

```text
GET /api/v1/filters
```

Artwork detail также разумно кешировать.

При переходе:

```text
catalog → detail → back
```

не нужно повторно загружать уже полученные данные без причины.

---

# 38. URL state

Фильтры и поиск желательно хранить в URL.

Например:

```text
/artworks?q=Иванов&author_id=123&period=19%20век&page=2
```

Это позволяет:

- обновить страницу без потери состояния;
- поделиться ссылкой;
- использовать browser back/forward.

---

# 39. Accessibility

Обязательно:

- semantic HTML;
- aria-label для icon-only buttons;
- focus states;
- keyboard navigation;
- достаточный contrast;
- корректные labels;
- кнопки должны быть `<button>`, а не `<div onClick>`.

Минимальный touch target:

```text
44x44 px
```

---

# 40. Responsive design

Использовать Tailwind breakpoints.

Основной принцип:

```text
mobile:
1 column

tablet:
1–2 columns

desktop:
2–4 columns
```

Detail:

```text
mobile:
image
audio
content

desktop:
image + information/player
```

На desktop можно сделать двухколоночный detail:

```text
┌──────────────────┬────────────────────┐
│                  │ Название           │
│     IMAGE        │ Автор              │
│                  │ Audio Player       │
│                  │ Description        │
└──────────────────┴────────────────────┘
```

---

# 41. Design

Визуальный стиль:

- современный;
- спокойный;
- музейный;
- минималистичный;
- много воздуха;
- хорошая типографика;
- изображение картины является главным визуальным элементом.

Не использовать:

- кислотные цвета;
- чрезмерные gradients;
- glassmorphism везде;
- сложные 3D-анимации;
- огромные декоративные элементы.

Цветовая схема должна хорошо работать и в light, и в dark mode.

---

# 42. Dark mode

Желательно поддержать dark mode.

Особенно полезно для использования в музее с приглушённым освещением.

Не делать отдельную сложную тему.

Использовать возможности Tailwind/shadcn.

---

# 43. Desktop

Desktop не является основным сценарием, но приложение должно выглядеть профессионально.

На больших экранах:

- ограничить максимальную ширину контента;
- не растягивать карточки на весь экран;
- использовать grid;
- detail сделать двухколоночным;
- scanner центрировать.

Рекомендуемый max-width:

```text
1200–1400px
```

---

# 44. Navigation

Главная навигация:

Mobile:

```text
Bottom Navigation
```

Desktop:

```text
Header
```

Например:

```text
Tretyakov Audio

Главная
Каталог
Сканировать QR
```

---

# 45. Browser Back

Обязательно корректно поддерживать:

```text
catalog → detail → back
```

и:

```text
catalog → filters → back
```

Состояние фильтров должно восстанавливаться через URL.

После QR:

```text
scan → detail
```

кнопка Back должна возвращать на scanner или предыдущий экран браузера в зависимости от нормального browser history flow.

Не ломать history искусственными `replace`, если это не требуется.

---

# 46. Image handling

Изображения могут загружаться удалённо.

Не предполагать наличие локальных assets.

Добавить:

- lazy loading;
- `alt`;
- placeholder;
- обработку ошибки загрузки.

Для artwork:

```html
<img
  src="..."
  alt="Название картины"
/>
```

---

# 47. Performance

Основные требования:

- lazy loading изображений;
- не загружать `picture_big` в каталоге;
- использовать `picture_thumb`;
- не загружать audio до Play;
- не держать несколько Audio instances одновременно;
- не делать повторные API-запросы без необходимости;
- code splitting для QR scanner допустим.

QR scanner можно загрузить lazy, поскольку он не нужен на каждой странице.

---

# 48. Audio architecture

Не создавать `<audio>` в каждой карточке.

Должен существовать один основной audio playback controller.

Минимальный вариант:

```text
AudioPlayer
    ↓
HTMLAudioElement
    ↓
currentArtwork
currentTime
duration
isPlaying
volume
playbackRate
```

Если используется React context/store — использовать минимальное решение.

---

# 49. Один активный audio

В приложении одновременно может воспроизводиться только один трек.

Если пользователь запустил другой:

```text
old audio → pause
new audio → play
```

Не должно быть ситуации, когда две картины одновременно проигрываются.

---

# 50. Audio persistence

Не обязательно сохранять позицию аудио между перезапусками браузера на первом этапе.

Но желательно сохранить:

```text
currentTrack
```

и состояние player между:

```text
detail → другой detail
```

если это не усложняет архитектуру.

---

# 51. Speakers

Backend поддерживает:

```text
aidar
baya
kseniya
xenia
eugene
```

В detail API используется:

```text
speaker
```

В audio endpoint:

```text
voice
```

Frontend должен использовать единый пользовательский термин:

```text
Голос
```

и отображать понятные названия.

Например:

```text
Айдар
Бая
Ксения
Ксения
Евгений
```

Но mapping необходимо вынести в отдельную конфигурацию.

Не разбрасывать строки по компонентам.

---

# 52. Выбор голоса

На первом этапе можно оставить default:

```text
baya
```

Выбор голоса реализовать как secondary control.

Например:

```text
Голос: Бая
```

При изменении голоса:

1. запросить detail/audio для выбранного speaker;
2. обновить audio URL;
3. не ломать текущий detail.

Если backend пока не гарантирует разные аудио для всех голосов, не делать голос центральной частью UI.

---

# 53. with_audio

Параметр:

```text
with_audio
```

не нужно автоматически включать в каждый запрос.

По умолчанию:

```text
false
```

Если backend генерирует аудио при `with_audio=true`, frontend должен использовать это только там, где действительно требуется.

Предпочтительный UX:

- detail загружается без принудительной генерации;
- пользователь нажимает "Слушать";
- если аудио отсутствует, frontend запускает flow генерации;
- после получения URL начинает playback.

Если backend contract фактически требует `with_audio=true` для получения `audio_url`, адаптировать реализацию после проверки реального API.

---

# 54. API errors

Нужно централизованно обработать:

```text
400
404
422
429
500
network error
```

Не показывать пользователю технические traceback.

Например:

```text
Не удалось загрузить произведение.
Попробуйте ещё раз.
```

Для 404:

```text
Произведение не найдено.
```

Для network error:

```text
Нет соединения с сервером.
Проверьте интернет и попробуйте снова.
```

---

# 55. Environment

Создать:

```text
.env.example
```

Пример:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Не коммитить реальные production secrets.

Frontend не должен содержать secret keys.

---

# 56. Development

README должен содержать:

```bash
npm install
npm run dev
```

или соответствующий package manager.

Также:

```bash
npm run build
npm run preview
```

и команды тестов.

---

# 57. Lint / formatting

Добавить:

- ESLint;
- Prettier или единый formatter;
- TypeScript strict mode.

Перед завершением:

```bash
npm run build
```

должен проходить без ошибок.

---

# 58. Playwright

Playwright обязателен для smoke/E2E проверки основных сценариев.

Минимальные сценарии:

## Test 1 — каталог

```text
open /
→ открыть каталог
→ увидеть список картин
```

## Test 2 — detail

```text
open /artworks/{id}
→ увидеть название
→ увидеть изображение
→ увидеть audio player
```

## Test 3 — поиск

```text
open /artworks
→ ввести поисковый запрос
→ дождаться API
→ увидеть результаты
```

## Test 4 — фильтр

```text
open /artworks
→ открыть filters
→ выбрать filter
→ применить
→ увидеть результат
```

## Test 5 — QR

Не обязательно использовать реальную камеру в CI.

Вместо этого мокнуть:

```text
POST /api/v1/artworks/find
```

и проверить:

```text
scanner result
→ API
→ navigate to detail
```

## Test 6 — audio

Замокать audio URL и проверить:

```text
Play
→ player state changes
```

---

# 59. Mock API

Для E2E и локальной разработки можно использовать Playwright route mocking.

Не нужно поднимать отдельный mock backend, если для этого нет необходимости.

API mocks должны повторять реальные response shapes из OpenAPI.

---

# 60. Context7

При разработке обязательно использовать Context7 для актуальной документации следующих технологий, когда возникает необходимость проверить API:

- React;
- React Router;
- shadcn/ui;
- Tailwind;
- Playwright;
- библиотека QR scanner;
- TanStack Query, если используется.

Не полагаться на устаревшие примеры из памяти.

Особенно важно проверить:

- актуальный способ создания shadcn компонентов;
- актуальный API выбранной QR библиотеки;
- browser camera requirements;
- React/TypeScript compatibility.

---

# 61. shadcn/ui

Использовать shadcn/ui для стандартных компонентов:

- Button;
- Input;
- Sheet;
- Dialog;
- Select;
- Checkbox;
- Badge;
- Skeleton;
- Separator;
- Tooltip;
- Slider;
- ScrollArea;
- DropdownMenu;
- Alert;
- Card.

Не нужно устанавливать все компоненты заранее.

Добавлять только реально используемые.

---

# 62. Components

Рекомендуемые компоненты:

```text
ArtworkCard
ArtworkGrid
ArtworkImage
ArtworkMeta
ArtworkGallery
ArtworkDescription
ArtworkFacts
ArtworkTechnicalInfo

AudioPlayer
AudioPlayerControls
AudioProgress
MiniAudioPlayer

SearchInput
ArtworkFilters
FilterSheet

QRScanner
QRScannerOverlay

AppHeader
BottomNavigation
PageContainer
EmptyState
ErrorState
LoadingState
```

Не обязательно создавать каждый компонент сразу.

Создавать компонент тогда, когда появляется повторное использование или компонент становится слишком большим.

---

# 63. Не делать

Запрещается без необходимости:

- писать весь frontend в одном App.tsx;
- делать огромные компоненты по 500+ строк;
- использовать `any`;
- дублировать API logic;
- делать API requests непосредственно в UI;
- хранить backend URL в компонентах;
- создавать собственную UI-библиотеку;
- использовать inline styles повсеместно;
- создавать Redux store только ради пары состояний;
- загружать оригинальные изображения в списке;
- создавать `<audio>` на каждую карточку;
- автоматически открывать внешние Tretyakov URL после QR;
- самостоятельно извлекать ID картины из QR URL;
- хранить секреты в frontend.

---

# 64. Приоритеты

Разработка должна идти строго по приоритетам.

## P0 — обязательно

1. React/Vite проект.
2. API client.
3. Routing.
4. Главная.
5. Каталог.
6. Поиск.
7. Фильтры.
8. Detail.
9. Image gallery.
10. Audio player.
11. QR scanner.
12. Responsive mobile UI.
13. Error/loading/empty states.
14. Playwright smoke tests.
15. Production build.

## P1 — после P0

1. Mini player.
2. Playback speed.
3. Voice selection.
4. Dark mode.
5. Более продвинутая gallery.
6. Улучшенные animations.
7. Infinite scroll.

## P2 — только если останется время

1. PWA.
2. Offline cache.
3. сохранение позиции аудио;
4. дополнительные accessibility улучшения;
5. advanced audio visualizer.

Не переходить к P1/P2, пока P0 не завершён.

---

# 65. Предлагаемый порядок реализации

## Этап 1 — Foundation

Создать:

```text
React + Vite + TypeScript
Tailwind
shadcn
React Router
API client
base layout
```

Проверить:

```bash
npm run build
```

---

## Этап 2 — API

Реализовать typed API:

```text
getArtworks()
getArtwork()
findArtwork()
getFilters()
getAudio()
```

Типы должны соответствовать OpenAPI.

---

## Этап 3 — Catalog

Сделать:

```text
/artworks
```

Включить:

- search;
- pagination;
- filters;
- loading;
- empty;
- error.

---

## Этап 4 — Detail

Сделать:

```text
/artworks/:id
```

Включить:

- image;
- title;
- author;
- metadata;
- description;
- facts;
- materials;
- techniques;
- placement.

---

## Этап 5 — Audio

Сделать:

```text
AudioPlayer
```

Сначала:

- play;
- pause;
- progress;
- seek;
- current time;
- duration;
- loading;
- error.

Затем:

- speed;
- volume;
- mini-player.

---

## Этап 6 — QR

Сделать:

```text
/scan
```

Проверить реальное поведение:

- Chrome Android;
- Safari iOS;
- permission denied;
- HTTPS;
- camera unavailable.

---

## Этап 7 — Responsive polish

Проверить:

```text
320
375
390
430
768
1024
1440
```

Исправить:

- overflow;
- text wrapping;
- image sizes;
- player controls;
- bottom navigation;
- touch targets.

---

## Этап 8 — Tests

Playwright:

```text
catalog
search
filter
detail
QR flow
audio player
```

---

# 66. Definition of Done

Проект считается готовым, если:

### Functional

- [ ] можно открыть каталог;
- [ ] можно искать;
- [ ] работают фильтры;
- [ ] можно открыть detail;
- [ ] отображается изображение;
- [ ] отображается описание;
- [ ] работает audio player;
- [ ] можно менять позицию аудио;
- [ ] можно менять скорость;
- [ ] QR scanner распознаёт QR;
- [ ] QR result отправляется на backend;
- [ ] найденная картина открывается в detail;
- [ ] корректно отображаются ошибки;
- [ ] работают loading states;
- [ ] работают empty states.

### Mobile

- [ ] интерфейс удобен на 320px;
- [ ] кнопки имеют достаточный touch target;
- [ ] scanner занимает удобную область экрана;
- [ ] player удобно использовать одной рукой;
- [ ] bottom navigation не перекрывает content;
- [ ] нет горизонтального scroll.

### Desktop

- [ ] каталог выглядит нормально;
- [ ] detail использует пространство экрана;
- [ ] header/navigation корректны;
- [ ] scanner центрирован.

### Technical

- [ ] TypeScript без ошибок;
- [ ] production build проходит;
- [ ] ESLint проходит;
- [ ] нет очевидных `any`;
- [ ] API logic вынесена из компонентов;
- [ ] backend URL через env;
- [ ] Playwright smoke tests проходят.

---

# 67. Требование к качеству реализации

Ты работаешь как frontend-разработчик, но backend API уже реализован.

Не изменяй backend API и не придумывай новые endpoints без необходимости.

Если обнаруживается несоответствие между OpenAPI и удобным UX:

1. сначала использовать существующий API;
2. определить, можно ли решить проблему на frontend;
3. только если невозможно — явно сообщить о необходимом изменении backend contract.

Не маскировать проблемы API большим количеством frontend-кода.

---

# 68. Работа с неизвестными деталями

Если какой-либо момент не определён этим ТЗ:

1. выбрать самый простой разумный вариант;
2. придерживаться существующего API;
3. не блокировать разработку вопросами, которые можно решить самостоятельно;
4. использовать Context7 для проверки актуального API библиотек;
5. не добавлять лишние зависимости.

Если есть несколько вариантов архитектуры, выбрать тот, который:

- проще;
- легче поддерживать;
- лучше работает на mobile;
- требует меньше кода;
- соответствует React best practices.

---

# 69. Важный UX-сценарий

Главный пользовательский путь должен ощущаться максимально коротким:

```text
Открыл приложение
      ↓
Сканировать QR
      ↓
Навёл камеру
      ↓
QR распознан
      ↓
Backend нашёл картину
      ↓
Открылся Detail
      ↓
Нажал Play
      ↓
Слушает аудиогид
```

Не вставлять между этими шагами лишние страницы.

---

# 70. Финальный результат

В результате должен быть готовый frontend-проект, который можно запустить:

```bash
npm install
npm run dev
```

и подключить к существующему FastAPI backend через:

```env
VITE_API_BASE_URL=...
```

Основная ценность приложения:

> Быстро найти картину в музее по QR-коду и сразу начать слушать качественный аудиогид.

Все решения в UI и архитектуре должны в первую очередь поддерживать именно этот сценарий.
