# ADR-0001: Бэкенд и слой данных — Supabase (Postgres + RLS) вместо mock-данных Lovable

- **Статус:** Accepted
- **Дата:** 2026-11-08
- **Авторы:** Nikita Klotsman
- **Затрагивает:** `src/data/mockData.ts`, `src/store/appointmentStore.ts`, `src/components/**`, `vite.config.ts`, `index.html`, `package.json`, lock-файлы, новые `supabase/`, `src/api/`

## Контекст

Репозиторий `clinic-calendar` — SPA, сгенерированная Lovable: Vite 5 + React 18 + TS + shadcn/ui + Tailwind, Zustand. Бэкенда нет.

Текущее состояние:

- Все данные — статика в `src/data/mockData.ts` (locations, physicians, patients, appointments, appointmentTypes). Компоненты импортируют её напрямую (`AppointmentSidebar`, `AppointmentCard`, `CalendarFilters`, `DayColumn`, `PhysiciansSection`).
- `useAppointmentStore` (Zustand) смешивает доменные данные (`appointments`, CRUD) и UI-состояние (view, фильтры, sidebar). После reload всё теряется.
- Расписание врачей живёт в `useState` внутри `PhysiciansSection` — теряется при unmount; `handleSaveSchedule` принимает `locationId`, но игнорирует его (availability не привязана к локации).
- Availability = `Record<weekday, "HH:MM"[]>` (список 15-мин слотов) — неудобно хранить и валидировать.
- Время: `date: "yyyy-MM-dd"` + `startTime: "HH:MM"` без часового пояса; `getDateString` в mock использует `toISOString()` → сдвиг даты в UTC.
- Инварианты только на клиенте: `isSlotAvailable` вызывается из sidebar; drag-and-drop (`DayColumn.handleDrop` → `rescheduleAppointment`) не проверяет пересечения и availability врача самого приёма.
- Нет auth/ролей, при этом данные — PII/PHI пациентов.
- `@tanstack/react-query`, `zod`, `react-hook-form` установлены, но для данных не используются.
- `deleteAppointment` удаляет приём безвозвратно; истории изменений нет.
- Lovable-специфика: `lovable-tagger` в `vite.config.ts`, шаблонный README, Lovable favicon, `og:image`/`twitter:image` на lovable.dev в `index.html`.
- В репозитории два lock-файла (`bun.lockb`, `package-lock.json`); скрипта `test` и тест-раннера нет.

Нужно: персистентность, многопользовательский доступ, auth + роли, серверная гарантия отсутствия double-booking, live-обновление календаря.

## Рассмотренные варианты

### A. Supabase напрямую из SPA (supabase-js + RLS + RPC)

- \+ SPA остаётся SPA, отдельный сервер не нужен.
- \+ Postgres: `EXCLUDE USING gist` гарантирует отсутствие пересечений на уровне БД.
- \+ Auth, RLS, Realtime, Storage, миграции (`supabase/migrations`), локальный стек (`supabase start`), генерация типов из коробки.
- \+ Lovable Cloud сам построен на Supabase — минимальный разрыв с текущим workflow.
- − Бизнес-логика частично в SQL (RLS, триггеры) — нужна дисциплина миграций и pgTAP-тесты.
- − Vendor lock-in на Auth/Realtime (данные — обычный Postgres, переносимы).
- − HIPAA/BAA только на платных планах — проверить до продакшена.

### B. Prisma ORM + собственный API (Hono/Fastify на Node, или миграция на Next.js)

- \+ Вся логика в TS, полный контроль, типобезопасный клиент.
- − Prisma не работает в браузере → обязателен отдельный сервер, деплой, CORS.
- − Auth, роли, realtime — писать/подключать самим (Better Auth / Auth.js, WebSocket/SSE).
- − Exclusion constraint Prisma не описывает — всё равно raw SQL в миграции.
- − Больше кода и инфраструктуры для MVP-объёма (~2.6k строк в `src` без `components/ui`, 5 сущностей).

### C. Гибрид: Supabase Postgres + Prisma в API-слое

- \+ Prisma DX + managed Postgres.
- − Клиент перестаёт ходить в БД напрямую → RLS по `auth.uid()` теряет смысл (сервер-ключ), Realtime требует отдельной настройки. Сложность B + lock-in A.

## Решение

**Вариант A — Supabase.**

Ключевые архитектурные правила:

1. **Источник правды — Postgres.** Инварианты держатся на таблице, а не на RPC, потому что клиент с правом записи может обратиться к ней напрямую через PostgREST:
   - длительность (15, 30, 45, 60, 90 минут) — `CHECK`;
   - приём в рамках availability — триггер `BEFORE INSERT OR UPDATE OF physician_id, location_id, starts_at, ends_at`, который сравнивает время в `locations.timezone`. Смена статуса проверку не запускает, поэтому изменение расписания не мешает закрыть уже назначенный приём;
   - отсутствие пересечений — exclusion constraint (правило 3).

   Создание и перенос — обычные `INSERT`/`UPDATE` из `src/api/*`; RPC не нужны. Клиентский `isSlotAvailable` остаётся только как UX-подсказка.

2. **Модель времени:** `appointments.starts_at/ends_at timestamptz`; `locations.timezone` (IANA). Availability — диапазоны: `physician_availability(physician_id, location_id, weekday, start_time, end_time)` с `CHECK (end_time > start_time)`. Диапазоны одного врача в один день не пересекаются, в том числе между локациями: `EXCLUDE USING gist (physician_id WITH =, weekday WITH =, timerange(start_time, end_time) WITH &&)`, где `timerange` — собственный range-тип над `time`. Соседние диапазоны одной локации триггер объединяет при проверке (`range_agg`), поэтому приём на их стыке допустим.
3. **Пересечения:** `EXCLUDE USING gist (physician_id WITH =, tstzrange(starts_at, ends_at) WITH &&) WHERE (status NOT IN ('cancelled','no-show'))` (+ `btree_gist`). Ошибка `23P01` → toast «слот занят».
4. **Доступ:** одна клиника на развёртывание, `clinic_id` в схеме нет. Supabase Auth; `clinic_members(user_id, role: admin|receptionist|physician, physician_id)`, где `physician_id` обязателен для роли `physician`; RLS на всех таблицах; врач видит только свои приёмы, если не admin/receptionist. Список пациентов читают все участники клиники, потому что врач сам записывает к себе новых пациентов; изменять пациентов могут только admin и receptionist. Роль и `physician_id` текущего пользователя читаются через `security definer`-функции, иначе политика на `clinic_members` уйдёт в рекурсию.
   - **Удаление:** приёмы не удаляются, отмена — через `status = 'cancelled'`; политики `DELETE` на `appointments` нет.
   - **Аудит:** триггер пишет изменения `appointments` и `patients` в `audit_log` (кто, когда, что, старое и новое значение). Клиент не может писать в журнал, читать его может только admin.
5. **Слой данных на клиенте:** `src/api/*` (repository-функции) + React Query hooks (`useAppointments(range, filters)`, `usePhysicians`, mutations с optimistic update). Компоненты не импортируют supabase-js и mock напрямую.
6. **Zustand — только UI-состояние** (`selectedDate`, `calendarView`, фильтры, sidebar).
7. **Типы:** `supabase gen types typescript` → `src/integrations/supabase/types.ts`; маппинг row → доменные типы в `src/api/mappers.ts`; `src/types/index.ts` остаётся доменным контрактом UI.
8. **Realtime:** подписка на всю таблицу `appointments` (строки фильтрует RLS, диапазон дат на сервере не задаётся) → `queryClient.invalidateQueries` при любом событии; данные из payload не используются.
9. **Lovable-зависимости удаляются:** `lovable-tagger`, шаблонный README, favicon, `og:image`/`twitter:image` в `index.html`.
10. **Инструменты:** остаётся один менеджер пакетов и один lock-файл; для тестов утилиты времени добавляется тест-раннер и скрипт `test`.

## Последствия

**Положительные**

- Данные персистентны, многопользовательский доступ, double-booking невозможен даже при гонке двух ресепшионистов.
- Чёткое разделение: UI-state (Zustand) / server-state (React Query) / инварианты (Postgres).
- Локальная разработка воспроизводима: `supabase start` + `seed.sql`.

**Отрицательные / риски**

- Нужны навыки SQL/RLS; ошибки в RLS = утечка PHI → обязательны pgTAP-тесты политик.
- Таймзоны: неправильная конвертация `HH:MM` ↔ `timestamptz` сломает календарь → единая утилита + тесты на DST.
- Переход availability со слотов на диапазоны требует переписать `PhysicianScheduleEditor` и `isPhysicianAvailableAtSlot`.
- Одна клиника на развёртывание: добавить мультитенантность позже — это `clinic_id` во всех таблицах, переписанные политики и миграция данных.
- Lock-in на Supabase Auth/Realtime. Митигировать: доступ к данным только через `src/api/*`; при уходе на вариант B меняется только этот слой + auth.

**Пересмотреть решение, если**

- Появится сложная серверная логика (интеграции EHR/HL7/FHIR, биллинг, напоминания SMS/email в больших объёмах) → вынести в отдельный сервис (Edge Functions или Node + Prisma, вариант C).
- Комплаенс-требования исключат Supabase как хостинг.
- Одной установкой должны будут пользоваться несколько клиник.

## Ссылки

- Supabase: Row Level Security, Database Functions, Realtime Postgres Changes, CLI migrations/type generation.
- PostgreSQL: Exclusion Constraints, `btree_gist`, range types (`tstzrange`).
