<!-- i18n-source: README.md@0e2a31d7dd488f1ed9a4008e59f99d1d28f823f5 status=reviewed -->
<!-- brand:start -->

<p align="center"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/banner-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/banner-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/banner-light.svg" alt="React Native Storage: Typed, validated key-value storage for React Native and Expo on MMKV, AsyncStorage or SecureStore."></picture></p>

<!-- lang-selector:start -->
<p align="center"><a href="README.md">English</a> · <a href="README.tr.md">Türkçe</a> · <a href="README.zh-CN.md">简体中文</a> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a> · <a href="README.es.md">Español</a> · <a href="README.de.md">Deutsch</a> · <a href="README.fr.md">Français</a> · <a href="README.pt-BR.md">Português (Brasil)</a> · <a href="README.ru.md">Русский</a></p>
<!-- lang-selector:end -->

<p align="center">
<a href="https://github.com/muhittincamdali/ReactNativeStorage/actions/workflows/ci.yml"><img src="https://github.com/muhittincamdali/ReactNativeStorage/actions/workflows/ci.yml/badge.svg" alt="CI 상태"></a>
<a href="https://github.com/muhittincamdali/ReactNativeStorage/releases"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-version-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-version-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-version-light.svg" alt="최신 버전: v1.0.0"></picture></a>
<a href="https://github.com/muhittincamdali/ReactNativeStorage/blob/main/LICENSE"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-license-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-license-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-license-light.svg" alt="라이선스: MIT"></picture></a>
<a href="https://github.com/muhittincamdali/ReactNativeStorage/blob/main/package.json"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-framework-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-framework-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-framework-light.svg" alt="언어 버전: React 18+"></picture></a>
</p>

<p align="center">
<a href="#빠른-시작"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-start-ko-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-start-ko-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-start-ko-light.svg" alt="시작하기"></picture></a>
<a href="https://muhittincamdali.github.io/ReactNativeStorage/"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-docs-ko-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-docs-ko-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-docs-ko-light.svg" alt="문서"></picture></a>
<a href="https://github.com/muhittincamdali/ReactNativeStorage/tree/main/Examples"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-examples-ko-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-examples-ko-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-examples-ko-light.svg" alt="예제"></picture></a>
</p>

> 이 문서는 영어 README의 번역본입니다. 내용이 다를 경우 영어 버전이 최신입니다.

<!-- brand:end -->

React Native와 Expo 앱에서 앱 데이터를 기기에 보관하기 위한 TypeScript 라이브러리입니다. 각 값을 이름, 기본값, 그리고 필요하면 스키마, 수명, 버전과 함께 한 번만 선언하면, 어디서든 읽고 쓸 수 있고 값이 바뀔 때 다시 렌더링되는 hook으로 컴포넌트에 표시할 수도 있습니다. 바이트는 선택한 driver(MMKV, AsyncStorage, SecureStore, `localStorage` 또는 메모리)가 저장합니다. 손으로 작성한 `JSON.parse(await AsyncStorage.getItem(...))` 호출로는 감당하기 어려워졌고, 저장된 데이터를 검증하고 타입을 지정하며 앱 버전이 바뀌어도 업그레이드할 수 있기를 원하는 앱을 위한 라이브러리입니다.

## 주요 기능

- **타입이 있고 검증됨** — 모든 [Standard Schema](https://standardschema.dev)(Zod, Valibot, ArkType) 또는 type guard가 쓰기와 읽기 시점에 값을 검사하며, 항목의 타입은 스키마에서 정해집니다.
- **다섯 가지 백엔드를 하나의 API로** — MMKV(동기식이므로 hook이 첫 렌더링부터 값을 가집니다), AsyncStorage, SecureStore(Keychain과 Keystore), `localStorage`, 메모리를 동일한 `get`, `set`, `remove`, `useStorageItem`으로 다룹니다.
- **앱 업데이트 후에도 살아남는 데이터** — 모든 레코드에 스키마 버전이 들어 있습니다. migration이 오래된 레코드를 단계별로 업그레이드하고, `legacy` 리더가 이 라이브러리를 쓰기 전에 저장된 값을 이어받으며, 더 새로운 앱 버전이 만든 레코드는 건드리지 않습니다.
- **만료** — 항목별 또는 쓰기별 time to live를 지정할 수 있으며, 만료된 값을 표시하는 컴포넌트는 만료되는 순간 기본값으로 돌아갑니다.
- **앱을 중단시키지 않는 실패 처리** — 손상되었거나 유효하지 않은 저장 데이터는 기본값을 반환하고 `onError`로 전달됩니다. 오류 메시지에는 키만 들어가고 값은 절대 들어가지 않습니다.
- **테스트됨** — Vitest 테스트 151개가 codec, 검증, migration, TTL, 동시 쓰기의 순서, 모든 driver, hook, 헬퍼를 다룹니다. 예제 앱은 [`scripts/e2e-ios.sh`](scripts/e2e-ios.sh)를 통해 iOS 27 시뮬레이터에서 실제 MMKV와 Keychain으로 실행됩니다.

## 빠른 시작

**1. 패키지 추가**

```sh
npm install github:muhittincamdali/ReactNativeStorage react-native-mmkv react-native-nitro-modules
```

패키지는 GitHub에서 설치합니다. MMKV는 네이티브 모듈이므로 Expo Go가 아니라 `npx expo run:ios` 또는 `npx expo run:android`(development build)로 앱을 실행하세요.

**2. 모듈 가져오기**

```tsx
import { createStorage, mmkvDriver } from 'react-native-storage-toolkit';
import { useStorageItem } from 'react-native-storage-toolkit/react';
```

**3. 사용하기**

[`Examples/StorageDemo/src/QuickStart.tsx`](Examples/StorageDemo/src/QuickStart.tsx)에 있는 이 컴포넌트는 버튼을 누른 횟수를 세고, 앱을 다시 시작해도 그 횟수를 계속 보여 줍니다.

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

## 설치

이 패키지는 npm 레지스트리에 없습니다. npm, pnpm 또는 Yarn으로 GitHub에서 설치하세요.

```sh
npm install github:muhittincamdali/ReactNativeStorage
```

TypeScript 소스로 배포되며 Metro, Expo, Vitest, `jest-expo` 프리셋이 이를 그대로 컴파일합니다. 설치 중에는 아무것도 실행되지 않습니다. 그다음 사용할 백엔드를 추가하세요.

| 백엔드 | 설치 | Driver |
| ------------ | --------------------------------------------------------------- | ----------------------------------------------- |
| MMKV         | `npx expo install react-native-mmkv react-native-nitro-modules` | `mmkvDriver(createMMKV())`                      |
| AsyncStorage | `npx expo install @react-native-async-storage/async-storage`    | `asyncStorageDriver(AsyncStorage)`              |
| SecureStore  | `npx expo install expo-secure-store`                            | `secureStoreDriver(SecureStore, options)`       |
| Web Storage  | 필요 없음                                                       | `webStorageDriver(window.localStorage, window)` |
| Memory       | 필요 없음                                                       | `memoryDriver()`                                |

## 사용법

아래 예제는 MMKV 대신 메모리 driver를 사용해 [`test/readme.test.ts`](test/readme.test.ts)에서 컴파일되고 실행됩니다.

### 스키마로 값 검증하기

스키마는 쓸 때와 읽을 때 실행됩니다. 유효하지 않은 값을 쓰면 거부되고 아무것도 기록되지 않으며, 저장된 유효하지 않은 값을 읽으면 기본값이 반환되고 `onError`가 호출됩니다.

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

### 컴포넌트에 값 표시하기

`useStorageItem`은 값, 값 또는 업데이터 함수를 받는 setter, 그리고 항목의 상태를 반환합니다. 그 항목을 표시하는 모든 컴포넌트는 쓰기가 어디에서 왔든 쓰기 이후에 다시 렌더링됩니다.

```tsx
function ThemePicker() {
  const [value, setValue, { status, error }] = useStorageItem(theme);
  if (status === 'error') return <Text>Could not read the theme: {error?.code}</Text>;
  return <Button title={`Theme: ${value}`} onPress={() => setValue('dark')} />;
}
```

비동기 driver(AsyncStorage, SecureStore)에서는 첫 렌더링이 기본값과 `status: 'loading'`을 가집니다.

### 값이 만료되게 하기

```ts
const draft = storage.item('draft', { defaultValue: '', ttl: 5 * 60 * 1000 });
await draft.set('Buy milk'); // gone five minutes later

const otp = storage.item<string>('otp');
await otp.set('482913', { ttl: 30_000 }); // a lifetime for one write
await storage.purgeExpired(); // removes every expired value in the namespace
```

### 저장된 데이터의 형태 바꾸기

`version`을 올리고 단계마다 migration을 추가하세요. 오래된 레코드는 읽을 때 업그레이드되어 새 형태로 저장됩니다.

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

### Keychain에 토큰 보관하기

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

`getOrCreateSecret(item)`은 무작위 키를 한 번 만들고 이후에는 그 키를 반환합니다. 예를 들어 MMKV 인스턴스를 암호화할 때 쓸 수 있습니다. [토큰과 키를 안전하게 보관하기](docs/guides/secure-values.md)를 참고하세요.

### Zustand store 영속화하기

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

같은 어댑터는 Jotai, Redux Persist, TanStack Query persister에서도 동작합니다.

## 데모

[`Examples/StorageDemo`](Examples/StorageDemo)는 위의 모든 기능을 실제 MMKV와 SecureStore로 사용하는 Expo SDK 58 앱(React Native 0.88)입니다. 카운터, Zod로 검증하는 테마, TTL이 5분인 임시 저장 글, 버전 1에서 migration한 프로필, `expo-crypto`로 만들어 Keychain에 보관하는 토큰이 들어 있습니다. 아래 화면은 앱을 iPhone 시뮬레이터에 설치하고 캡처하는 [`scripts/capture-screenshots.sh`](scripts/capture-screenshots.sh)로 만든 것입니다.

| 라이트                                                                          | 다크                                                                          |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| ![Storage Demo, 화면 상단, 라이트](docs/images/demo-top-light.png)       | ![Storage Demo, 화면 상단, 다크](docs/images/demo-top-dark.png)       |
| ![Storage Demo, 화면 하단, 라이트](docs/images/demo-bottom-light.png) | ![Storage Demo, 화면 하단, 다크](docs/images/demo-bottom-dark.png) |

직접 실행해 보세요.

```sh
cd Examples/StorageDemo
npm install
npx expo run:ios      # or: npx expo run:android, npx expo start --web
```

## 문서

API 레퍼런스와 문서:

- [API 레퍼런스](https://muhittincamdali.github.io/ReactNativeStorage/) — 모든 export. 소스에서 TypeDoc으로 생성합니다(`npm run docs`를 실행하면 로컬의 `docs/api`에 생성됩니다).
- [오류 코드](src/errors.ts) — 각 `StorageError` 코드의 의미.

## 가이드

- [AsyncStorage에서 MMKV로 옮기기](docs/guides/migrating-from-async-storage.md) — 기존 키를 한 번 복사하고 `legacy`로 읽습니다.
- [저장된 데이터의 형태 바꾸기](docs/guides/schemas-and-migrations.md) — 스키마, 버전, migration, 그리고 codec이 유지하는 값.
- [토큰과 키를 안전하게 보관하기](docs/guides/secure-values.md) — SecureStore와 MMKV용 암호화 키.
- [스토리지를 쓰는 코드 테스트하기](docs/guides/testing.md) — 메모리 driver, 제어 가능한 시계, Jest 설정.

## 요구 사항

| 툴체인 | 최소 버전 |
| ----------------------------------- | ------------------------------------- |
| React                               | 18(`useSyncExternalStore` 때문에)       |
| TypeScript(타입 검사를 하는 경우)   | 5.0                                   |
| react-native-mmkv(`mmkvDriver` 용)  | 3(버전 4는 React Native 0.76 필요)    |
| Node.js(이 저장소에서 작업하는 경우) | 22.12                                |

예제 앱과 엔드투엔드 스크립트는 Expo SDK 58, React Native 0.88, Xcode 27, iOS 27 시뮬레이터에서 테스트했습니다.

## 아키텍처

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

기여자가 알아 두어야 할 설계 결정:

- driver는 앱이 만든 인스턴스를 감싸고 그 형태로 일치 여부를 판단합니다. 그래서 이 패키지에는 런타임 의존성이 없고 각 백엔드의 여러 버전을 지원합니다.
- 읽기는 잘못된 데이터 때문에 예외를 던지지 않으며, driver 자체가 실패할 때만 던집니다. 쓰기는 거부되고 아무것도 기록하지 않습니다.
- key store는 쓰기를 즉시 보여 주고, 같은 키에 대한 쓰기를 호출 순서대로 보냅니다. 가장 최근 쓰기가 실패하면 백엔드가 마지막으로 확인한 값으로 되돌아갑니다.
- 모든 제한은 경계에서 검사합니다. 키의 길이와 문자, UTF-8 바이트 기준 값의 크기, 중첩 깊이, 스키마 버전, TTL(유한하고 안전한 정수 범위 안), 타이머 지연(최대 2^31-1 ms)이 그 대상입니다.

## 로드맵

다음 계획은 [issue tracker](https://github.com/muhittincamdali/ReactNativeStorage/issues)에서 관리합니다.

- 패키지를 npm 레지스트리에 게시
- CI에서 Android 에뮬레이터로 엔드투엔드 스크립트 실행
- SecureStore용 선택적 키 인덱스(로그아웃할 때 `clear()`가 모든 시크릿을 지울 수 있도록)

## 기여하기

기여를 환영합니다. pull request를 열기 전에 [기여 가이드](https://github.com/muhittincamdali/ReactNativeStorage/blob/main/CONTRIBUTING.md)와 [행동 강령](https://github.com/muhittincamdali/ReactNativeStorage/blob/main/CODE_OF_CONDUCT.md)을 읽어 주세요. 보안 문제는 [보안 정책](https://github.com/muhittincamdali/ReactNativeStorage/blob/main/SECURITY.md)에 따라 비공개로 제보해 주세요.

## 라이선스

MIT 라이선스로 배포됩니다. 자세한 내용은 [LICENSE](LICENSE)를 참고하세요.
