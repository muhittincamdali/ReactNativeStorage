<!-- i18n-source: README.md@5cce8b18fbbe77cdfe1e2e6a4f1fb2f0ccbcb3bf status=reviewed -->
<!-- brand:start -->

<p align="center"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/banner-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/banner-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/banner-light.svg" alt="React Native Storage: Typed, validated key-value storage for React Native and Expo on MMKV, AsyncStorage or SecureStore."></picture></p>

<!-- lang-selector:start -->
<p align="center"><a href="README.md">English</a> · <a href="README.tr.md">Türkçe</a> · <a href="README.zh-CN.md">简体中文</a> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a> · <a href="README.es.md">Español</a> · <a href="README.de.md">Deutsch</a> · <a href="README.fr.md">Français</a> · <a href="README.pt-BR.md">Português (Brasil)</a> · <a href="README.ru.md">Русский</a></p>
<!-- lang-selector:end -->

<p align="center">
<a href="https://github.com/muhittincamdali/ReactNativeStorage/actions/workflows/ci.yml"><img src="https://github.com/muhittincamdali/ReactNativeStorage/actions/workflows/ci.yml/badge.svg" alt="Статус CI"></a>
<a href="https://github.com/muhittincamdali/ReactNativeStorage/releases"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-version-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-version-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-version-light.svg" alt="Последняя версия: v2.0.0"></picture></a>
<a href="https://github.com/muhittincamdali/ReactNativeStorage/blob/main/LICENSE"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-license-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-license-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-license-light.svg" alt="Лицензия: MIT"></picture></a>
<a href="https://github.com/muhittincamdali/ReactNativeStorage/blob/main/package.json"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-framework-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-framework-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-framework-light.svg" alt="Версия языка: React 18+"></picture></a>
</p>

<p align="center">
<a href="#быстрый-старт"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-start-ru-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-start-ru-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-start-ru-light.svg" alt="Начать"></picture></a>
<a href="https://github.com/muhittincamdali/ReactNativeStorage/blob/main/docs/guides/overview.md"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-docs-ru-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-docs-ru-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-docs-ru-light.svg" alt="Документация"></picture></a>
<a href="https://github.com/muhittincamdali/ReactNativeStorage/tree/main/Examples"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-examples-ru-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-examples-ru-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-examples-ru-light.svg" alt="Примеры"></picture></a>
</p>

> Это перевод README на английском языке. Если они расходятся, актуальна английская версия.

<!-- brand:end -->

Библиотека на TypeScript для хранения данных приложения на устройстве в приложениях React Native и Expo. Вы объявляете каждое значение один раз: имя, значение по умолчанию и, при желании, схему, срок жизни и версию. После этого его можно читать и записывать откуда угодно или показывать в компоненте с помощью hook, который перерисовывается при изменении значения. Байты сохраняет выбранный вами driver: MMKV, AsyncStorage, SecureStore, `localStorage` или память. Библиотека рассчитана на приложения, которым уже тесны рукописные вызовы вроде `JSON.parse(await AsyncStorage.getItem(...))` и которым нужно, чтобы сохранённые данные проверялись, были типизированы и обновлялись между версиями приложения.

## Основные возможности

- **Типизация и проверка** — любой [Standard Schema](https://standardschema.dev) (Zod, Valibot, ArkType) или type guard проверяет значения при записи и при чтении; тип элемента берётся из схемы.
- **Один API для пяти бэкендов** — MMKV (синхронный, поэтому у hook значение есть уже при первой отрисовке), AsyncStorage, SecureStore (Keychain и Keystore), `localStorage` и память — с одними и теми же `get`, `set`, `remove` и `useStorageItem`.
- **Данные, которые переживают обновления приложения** — каждая запись содержит версию схемы; migration шаг за шагом обновляют старые записи, читатель `legacy` подхватывает значения, записанные до появления этой библиотеки, а записи более новой версии приложения остаются нетронутыми.
- **Срок действия** — time to live для элемента или для отдельной записи; компонент, показывающий просроченное значение, возвращается к значению по умолчанию в момент истечения срока.
- **Ошибки, не роняющие приложение** — повреждённые или недопустимые сохранённые данные возвращают значение по умолчанию и попадают в `onError`; в сообщениях об ошибках указан ключ, но никогда не значение.
- **Протестировано** — 164 теста Vitest покрывают codec, проверку, migration, TTL, порядок параллельных записей, каждый driver, hook и вспомогательные функции; пример приложения запускается на симуляторе iOS 27 с настоящими MMKV и Keychain в [`scripts/e2e-ios.sh`](scripts/e2e-ios.sh).

## Быстрый старт

**1. Добавьте пакет**

```sh
npm install github:muhittincamdali/ReactNativeStorage react-native-mmkv react-native-nitro-modules
```

Пакет устанавливается из GitHub. MMKV — нативный модуль: запускайте приложение через `npx expo run:ios` или `npx expo run:android` (development build), а не в Expo Go.

**2. Импортируйте модуль**

```tsx
import { createStorage, mmkvDriver } from 'react-native-storage-toolkit';
import { useStorageItem } from 'react-native-storage-toolkit/react';
```

**3. Используйте**

Этот компонент из [`Examples/StorageDemo/src/QuickStart.tsx`](Examples/StorageDemo/src/QuickStart.tsx) считает нажатия и продолжает показывать счётчик после перезапуска приложения:

```tsx
import { Button } from 'react-native';
import { createMMKV } from 'react-native-mmkv';
import { createStorage, mmkvDriver } from 'react-native-storage-toolkit';
import { useStorageItem } from 'react-native-storage-toolkit/react';

const storage = createStorage({ driver: mmkvDriver(createMMKV()) });
export const pressCount = storage.item('press-count', { defaultValue: 0 });

export function PressCounter() {
  const [count, setCount] = useStorageItem(pressCount);
  return <Button title={`Pressed ${count} times`} onPress={() => setCount((n) => n + 1)} />;
}
```

## Установка

Пакета нет в реестре npm. Установите его из GitHub с помощью npm, pnpm или Yarn:

```sh
npm install github:muhittincamdali/ReactNativeStorage
```

Он поставляется с исходным кодом на TypeScript, который Metro, Expo, Vitest и пресет `jest-expo` компилируют напрямую; при установке ничего не запускается. Затем добавьте бэкенд, который хотите использовать:

| Бэкенд       | Установка                                                       | Driver                                          |
| ------------ | --------------------------------------------------------------- | ----------------------------------------------- |
| MMKV         | `npx expo install react-native-mmkv react-native-nitro-modules` | `mmkvDriver(createMMKV())`                      |
| AsyncStorage | `npx expo install @react-native-async-storage/async-storage`    | `asyncStorageDriver(AsyncStorage)`              |
| SecureStore  | `npx expo install expo-secure-store`                            | `secureStoreDriver(SecureStore, options)`       |
| Web Storage  | не требуется                                                    | `webStorageDriver(window.localStorage, window)` |
| Memory       | не требуется                                                    | `memoryDriver()`                                |

## Использование

Примеры ниже компилируются и запускаются в [`test/readme.test.tsx`](test/readme.test.tsx) с driver памяти вместо MMKV.

### Проверка значений схемой

Схема работает и при записи, и при чтении. Запись недопустимого значения отклоняется и ничего не записывает; чтение недопустимого сохранённого значения возвращает значение по умолчанию и вызывает `onError`.

```ts
import { z } from 'zod';

const storage = createStorage({
  driver: mmkvDriver(createMMKV()),
  namespace: 'app',
  onError: (error) => console.warn(error.code, error.key), // the key, never the value
});

export const theme = storage.item('theme', {
  schema: z.enum(['system', 'light', 'dark']),
  defaultValue: 'system',
});

await theme.set('dark');
await theme.set('purple'); // rejects: StorageError VALIDATION_FAILED
```

### Показ значения в компоненте

`useStorageItem` возвращает значение, setter, принимающий значение или функцию обновления, и состояние элемента. Каждый компонент, показывающий элемент, перерисовывается после записи, откуда бы она ни пришла.

```tsx
function ThemePicker() {
  const [value, setValue, { status, error }] = useStorageItem(theme);
  if (status === 'error') return <Text>Could not read the theme: {error?.code}</Text>;
  return <Button title={`Theme: ${value}`} onPress={() => setValue('dark')} />;
}
```

С асинхронным driver (AsyncStorage, SecureStore) первая отрисовка получает значение по умолчанию и `status: 'loading'`.

### Срок действия значений

```ts
const draft = storage.item('draft', { defaultValue: '', ttl: 5 * 60 * 1000 });
await draft.set('Buy milk'); // gone five minutes later

const otp = storage.item<string>('otp');
await otp.set('482913', { ttl: 30_000 }); // a lifetime for one write
await storage.purgeExpired(); // removes every expired value in the namespace
```

### Изменение формы сохранённых данных

Увеличьте `version` и добавьте migration для каждого шага. Старые записи обновляются при чтении и сохраняются в новой форме.

```ts
export const profile = storage.item('profile', {
  schema: z.object({ first: z.string(), last: z.string() }),
  version: 2,
  migrations: {
    2: (old) => {
      const [first = '', ...rest] = String((old as { name?: unknown }).name ?? '').split(' ');
      return { first, last: rest.join(' ') };
    },
  },
});
```

### Хранение токена в Keychain

```ts
import * as SecureStore from 'expo-secure-store';

const secure = createStorage({
  driver: secureStoreDriver(SecureStore, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  }),
  namespace: 'auth',
});
export const refreshToken = secure.item('refresh-token', { schema: z.string() });
```

`getOrCreateSecret(item)` один раз создаёт случайный ключ и затем возвращает его — например, чтобы зашифровать экземпляр MMKV; см. [Безопасное хранение токенов и ключей](docs/guides/secure-values.md). Она никогда не перезаписывает сохранённое значение, которое не может использовать: повреждённые, недопустимые или просроченные данные отклоняются с `StorageError` и остаются на месте.

### Сохранение store Zustand

```ts
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { toStateStorage } from 'react-native-storage-toolkit';

type Cart = { items: string[]; add: (item: string) => void };

export const useCart = create<Cart>()(
  persist(
    (set) => ({ items: [], add: (item) => set((cart) => ({ items: [...cart.items, item] })) }),
    {
      name: 'cart',
      storage: createJSONStorage(() => toStateStorage(storage)),
    },
  ),
);
```

Тот же адаптер работает с Jotai, Redux Persist и persister для TanStack Query.

## Демо

[`Examples/StorageDemo`](Examples/StorageDemo) — приложение на Expo SDK 58 (React Native 0.88), которое использует все перечисленные выше возможности с настоящими MMKV и SecureStore: счётчик, тема, проверяемая через Zod, черновик с TTL в пять минут, профиль, перенесённый с версии 1, и токен, созданный через `expo-crypto` и хранящийся в Keychain. Экраны ниже получены с помощью [`scripts/capture-screenshots.sh`](scripts/capture-screenshots.sh), который устанавливает приложение на симулятор iPhone и делает снимки.

| Светлая                                                                         | Тёмная                                                                        |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| ![Storage Demo, верх экрана, светлая тема](docs/images/demo-top-light.png)       | ![Storage Demo, верх экрана, тёмная тема](docs/images/demo-top-dark.png)       |
| ![Storage Demo, низ экрана, светлая тема](docs/images/demo-bottom-light.png) | ![Storage Demo, низ экрана, тёмная тема](docs/images/demo-bottom-dark.png) |

Запустите сами:

```sh
cd Examples/StorageDemo
npm install
npx expo run:ios      # or: npx expo run:android, npx expo start --web
```

## Документация

Справочник API и статьи:

- Справочник по API — все экспорты, собранные TypeDoc из исходного кода (`npm run docs` собирает его локально в `docs/api`); [workflow Docs](.github/workflows/docs.yml) публикует его на GitHub Pages из `main`.
- [Коды ошибок](src/errors.ts) — что означает каждый код `StorageError`.

## Руководства

- [Переход с AsyncStorage на MMKV](docs/guides/migrating-from-async-storage.md) — один раз скопируйте старые ключи и читайте их через `legacy`.
- [Изменение формы сохранённых данных](docs/guides/schemas-and-migrations.md) — схемы, версии и migration, а также какие значения сохраняет codec.
- [Безопасное хранение токенов и ключей](docs/guides/secure-values.md) — SecureStore и ключ шифрования для MMKV.
- [Тестирование кода, использующего хранилище](docs/guides/testing.md) — driver памяти, управляемые часы и настройки Jest.

## Требования

| Инструмент                          | Минимальная версия                    |
| ----------------------------------- | ------------------------------------- |
| React                               | 18 (для `useSyncExternalStore`)       |
| TypeScript, если вы проверяете типы | 5.0                                   |
| react-native-mmkv, для `mmkvDriver` | 3 (версия 4 требует React Native 0.76) |
| Node.js, для работы с этим репозиторием | 22.12                             |

Пример приложения и сквозной скрипт протестированы с Expo SDK 58, React Native 0.88, Xcode 27 и симулятором iOS 27.

## Архитектура

```text
useStorageItem (src/react.ts)          React hook over useSyncExternalStore
        │
StorageItem (src/item.ts)              get / set / remove, snapshots, expiry timers
        │  RecordFormat (src/record.ts)   schema, versions, migrations, legacy, size limit
        │  codec + envelope               {rns, s, e, d} records; Date, Map, Set, bigint, NaN…
        │
Storage (src/storage.ts)               namespace, keys, clear, purgeExpired, onError
        │  KeyStore (src/keyStore.ts)     LRU cache, shared reads, ordered writes, listeners
        │
StorageDriver (src/driver.ts)          mmkv · async-storage · secure-store · web-storage · memory
```

Решения, которые стоит знать контрибьютору:

- Driver адаптируют экземпляр, созданный приложением, и определяют его по форме, поэтому у пакета нет runtime-зависимостей и он поддерживает несколько версий каждого бэкенда.
- Чтение никогда не выбрасывает исключение из-за плохих данных, только из-за сбоя driver; запись отклоняется и ничего не записывает.
- Key store показывает запись сразу и отправляет записи по одному ключу в порядке вызовов; если самая новая запись не удалась, он возвращается к последнему значению, подтверждённому бэкендом.
- Каждое ограничение проверяется на границе: длина и символы ключа, размер значения в байтах UTF-8, глубина вложенности, версии схемы, TTL (конечные и в пределах безопасных целых чисел) и задержки таймеров (не более 2^31-1 мс).

## План развития

В планах, отслеживается в [issue tracker](https://github.com/muhittincamdali/ReactNativeStorage/issues):

- опубликовать пакет в реестре npm;
- запускать сквозной скрипт на эмуляторе Android в CI;
- необязательный индекс ключей для SecureStore, чтобы `clear()` мог удалять все секреты при выходе из аккаунта.

## Участие в разработке

Мы рады вашему участию. Перед открытием pull request прочитайте [руководство для участников](https://github.com/muhittincamdali/ReactNativeStorage/blob/main/CONTRIBUTING.md) и [кодекс поведения](https://github.com/muhittincamdali/ReactNativeStorage/blob/main/CODE_OF_CONDUCT.md). О проблемах безопасности сообщайте конфиденциально, как описано в [политике безопасности](https://github.com/muhittincamdali/ReactNativeStorage/blob/main/SECURITY.md).

## Лицензия

Распространяется по лицензии MIT. Подробнее — в файле [LICENSE](LICENSE).
