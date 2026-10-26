<!-- i18n-source: README.md@9ca949643242ad064ad3c2837eaccca29b820b9c status=reviewed -->
<!-- brand:start -->

<p align="center"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/banner-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/banner-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/banner-light.svg" alt="React Native Storage: Typed, validated key-value storage for React Native and Expo on MMKV, AsyncStorage or SecureStore."></picture></p>

<!-- lang-selector:start -->
<p align="center"><a href="README.md">English</a> · <a href="README.tr.md">Türkçe</a> · <a href="README.zh-CN.md">简体中文</a> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a> · <a href="README.es.md">Español</a> · <a href="README.de.md">Deutsch</a> · <a href="README.fr.md">Français</a> · <a href="README.pt-BR.md">Português (Brasil)</a> · <a href="README.ru.md">Русский</a></p>
<!-- lang-selector:end -->

<p align="center">
<a href="https://github.com/muhittincamdali/ReactNativeStorage/actions/workflows/ci.yml"><img src="https://github.com/muhittincamdali/ReactNativeStorage/actions/workflows/ci.yml/badge.svg" alt="CI 状态"></a>
<a href="https://github.com/muhittincamdali/ReactNativeStorage/releases"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-version-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-version-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-version-light.svg" alt="最新版本: v1.0.0"></picture></a>
<a href="https://github.com/muhittincamdali/ReactNativeStorage/blob/main/LICENSE"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-license-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-license-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-license-light.svg" alt="许可证: MIT"></picture></a>
<a href="https://github.com/muhittincamdali/ReactNativeStorage/blob/main/package.json"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-framework-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-framework-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-framework-light.svg" alt="语言版本: React 18+"></picture></a>
</p>

<p align="center">
<a href="#快速开始"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-start-zh-CN-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-start-zh-CN-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-start-zh-CN-light.svg" alt="开始使用"></picture></a>
<a href="https://muhittincamdali.github.io/ReactNativeStorage/"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-docs-zh-CN-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-docs-zh-CN-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-docs-zh-CN-light.svg" alt="文档"></picture></a>
<a href="https://github.com/muhittincamdali/ReactNativeStorage/tree/main/Examples"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-examples-zh-CN-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-examples-zh-CN-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-examples-zh-CN-light.svg" alt="示例"></picture></a>
</p>

> 本文是英文 README 的译文。如两者内容不一致，以英文版为准。

<!-- brand:end -->

一个 TypeScript 库，用于在 React Native 和 Expo 应用中把应用数据保存在设备上。每个值只需声明一次：名称、默认值，以及可选的 schema、有效期和版本；之后你可以在任何地方读写它，也可以用一个会在值变化时重新渲染的 hook 把它显示在组件中。数据由你选择的 driver 存储：MMKV、AsyncStorage、SecureStore、`localStorage` 或内存。它适合那些已经不再满足于手写 `JSON.parse(await AsyncStorage.getItem(...))` 调用、希望已存储的数据能够被校验、有类型，并且能跨应用版本升级的应用。

## 亮点

- **有类型且经过校验** — 任何 [Standard Schema](https://standardschema.dev)（Zod、Valibot、ArkType）或类型守卫（type guard）都会在写入和读取时检查值；条目的类型来自 schema。
- **一套 API 对应五种后端** — MMKV（同步，因此 hook 在首次渲染时就能拿到值）、AsyncStorage、SecureStore（Keychain 和 Keystore）、`localStorage` 和内存，都使用相同的 `get`、`set`、`remove` 和 `useStorageItem`。
- **数据在应用更新后依然可用** — 每条记录都带有 schema 版本；migration 会逐步升级旧记录，`legacy` 读取器会接管在使用本库之前写入的值，来自更新版本应用的记录则保持不变。
- **过期** — 可按条目或按单次写入设置 time to live；显示已过期值的组件会在过期的那一刻回退到默认值。
- **失败不会让应用崩溃** — 已存储的数据若损坏或无效，会返回默认值并触发 `onError`；错误信息只会指出键，绝不包含值。
- **经过测试** — 164 个 Vitest 测试覆盖 codec、校验、migration、TTL、并发写入的顺序、每个 driver、hook 和辅助函数；示例应用通过 [`scripts/e2e-ios.sh`](scripts/e2e-ios.sh) 在 iOS 27 模拟器上针对真实的 MMKV 和 Keychain 运行。

## 快速开始

**1. 添加软件包**

```sh
npm install github:muhittincamdali/ReactNativeStorage react-native-mmkv react-native-nitro-modules
```

该包从 GitHub 安装。MMKV 是原生模块：请用 `npx expo run:ios` 或 `npx expo run:android`（开发构建）运行应用，不能在 Expo Go 中运行。

**2. 导入模块**

```tsx
import { createStorage, mmkvDriver } from 'react-native-storage-toolkit';
import { useStorageItem } from 'react-native-storage-toolkit/react';
```

**3. 开始使用**

下面这个组件来自 [`Examples/StorageDemo/src/QuickStart.tsx`](Examples/StorageDemo/src/QuickStart.tsx)，它统计按压次数，并且在应用重启后仍会显示该次数：

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

## 安装

该包不在 npm registry 上。请用 npm、pnpm 或 Yarn 从 GitHub 安装：

```sh
npm install github:muhittincamdali/ReactNativeStorage
```

它以 TypeScript 源码发布，Metro、Expo、Vitest 和 `jest-expo` preset 可直接编译；安装时不会运行任何脚本。然后添加你要使用的后端：

| 后端 | 安装 | Driver |
| ------------ | --------------------------------------------------------------- | ----------------------------------------------- |
| MMKV         | `npx expo install react-native-mmkv react-native-nitro-modules` | `mmkvDriver(createMMKV())`                      |
| AsyncStorage | `npx expo install @react-native-async-storage/async-storage`    | `asyncStorageDriver(AsyncStorage)`              |
| SecureStore  | `npx expo install expo-secure-store`                            | `secureStoreDriver(SecureStore, options)`       |
| Web Storage  | 无需安装                                                        | `webStorageDriver(window.localStorage, window)` |
| Memory       | 无需安装                                                        | `memoryDriver()`                                |

## 使用方法

下面的示例由 [`test/readme.test.tsx`](test/readme.test.tsx) 编译并运行，测试中用内存 driver 代替 MMKV。

### 用 schema 校验值

schema 会在写入和读取时运行。写入无效值会被拒绝，且不会写入任何内容；读取到已存储的无效值时，会返回默认值并调用 `onError`。

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

### 在组件中显示值

`useStorageItem` 返回值、一个接受值或更新函数的 setter，以及条目的状态。无论写入来自哪里，显示该条目的每个组件都会在写入后重新渲染。

```tsx
function ThemePicker() {
  const [value, setValue, { status, error }] = useStorageItem(theme);
  if (status === 'error') return <Text>Could not read the theme: {error?.code}</Text>;
  return <Button title={`Theme: ${value}`} onPress={() => setValue('dark')} />;
}
```

使用异步 driver（AsyncStorage、SecureStore）时，首次渲染拿到的是默认值，且 `status: 'loading'`。

### 让值过期

```ts
const draft = storage.item('draft', { defaultValue: '', ttl: 5 * 60 * 1000 });
await draft.set('Buy milk'); // gone five minutes later

const otp = storage.item<string>('otp');
await otp.set('482913', { ttl: 30_000 }); // a lifetime for one write
await storage.purgeExpired(); // removes every expired value in the namespace
```

### 修改已存储数据的结构

提高 `version`，并为每一步添加一个 migration。旧记录会在读取时升级，并以新的结构保存。

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

### 把 token 保存在 Keychain 中

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

`getOrCreateSecret(item)` 只会创建一次随机密钥，之后直接返回它，例如用来加密 MMKV 实例；参见[妥善保管 token 和密钥](docs/guides/secure-values.md)。它绝不会覆盖无法使用的已存值：损坏、无效或已过期的数据会以 `StorageError` 拒绝，并保持原样。

### 持久化 Zustand store

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

同一个适配器也适用于 Jotai、Redux Persist 和 TanStack Query 的 persister。

## 演示

[`Examples/StorageDemo`](Examples/StorageDemo) 是一个 Expo SDK 58 应用（React Native 0.88），它使用真实的 MMKV 和 SecureStore 演示上述所有功能：一个计数器、一个由 Zod 校验的主题、一份 TTL 为五分钟的草稿、一份从版本 1 迁移而来的个人资料，以及一个用 `expo-crypto` 创建并保存在 Keychain 中的 token。下面的截图来自 [`scripts/capture-screenshots.sh`](scripts/capture-screenshots.sh)，该脚本会把应用安装到 iPhone 模拟器上并截图。

| 浅色                                                                            | 深色                                                                          |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| ![Storage Demo，屏幕上部，浅色](docs/images/demo-top-light.png)       | ![Storage Demo，屏幕上部，深色](docs/images/demo-top-dark.png)       |
| ![Storage Demo，屏幕下部，浅色](docs/images/demo-bottom-light.png) | ![Storage Demo，屏幕下部，深色](docs/images/demo-bottom-dark.png) |

自己运行一下：

```sh
cd Examples/StorageDemo
npm install
npx expo run:ios      # or: npx expo run:android, npx expo start --web
```

## 文档

API 参考文档与文章：

- [API 参考](https://muhittincamdali.github.io/ReactNativeStorage/) — 所有导出项，由 TypeDoc 根据源码生成（`npm run docs` 会在本地生成到 `docs/api`）。
- [错误码](src/errors.ts) — 每个 `StorageError` 错误码的含义。

## 指南

- [从 AsyncStorage 迁移到 MMKV](docs/guides/migrating-from-async-storage.md) — 一次性复制旧的键，并通过 `legacy` 读取。
- [修改已存储数据的结构](docs/guides/schemas-and-migrations.md) — schema、版本和 migration，以及 codec 会保留哪些值。
- [妥善保管 token 和密钥](docs/guides/secure-values.md) — SecureStore，以及 MMKV 的加密密钥。
- [测试使用存储的代码](docs/guides/testing.md) — 内存 driver、可控的时钟和 Jest 设置。

## 系统要求

| 工具链 | 最低版本 |
| ----------------------------------- | ------------------------------------- |
| React                               | 18（用于 `useSyncExternalStore`）       |
| TypeScript，如果需要类型检查        | 5.0                                   |
| react-native-mmkv，用于 `mmkvDriver` | 3（版本 4 需要 React Native 0.76）    |
| Node.js，用于开发本仓库             | 22.12                                 |

示例应用和端到端脚本在 Expo SDK 58、React Native 0.88、Xcode 27 和 iOS 27 模拟器上测试通过。

## 架构

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

贡献者需要了解的设计决策：

- Driver 适配的是应用自己创建的实例，并按其结构进行匹配，因此该包没有运行时依赖，并且支持每种后端的多个版本。
- 读取遇到错误数据时不会抛出异常，只有 driver 本身失败时才会抛出；写入会被拒绝，且不会写入任何内容。
- Key store 会立即显示写入的值，并按调用顺序把对同一个键的写入发送出去；当最新的写入失败时，它会回到后端最后确认的值。
- 每项限制都在边界处检查：键的长度和字符、以 UTF-8 字节计的值大小、嵌套深度、schema 版本、TTL（有限且在安全整数范围内）以及定时器延迟（最多 2^31-1 ms）。

## 路线图

接下来的计划，在 [issue tracker](https://github.com/muhittincamdali/ReactNativeStorage/issues) 中跟踪：

- 把该包发布到 npm registry；
- 在 CI 中用 Android 模拟器运行端到端脚本；
- 为 SecureStore 提供可选的键索引，这样 `clear()` 就能在退出登录时删除所有密钥。

## 参与贡献

欢迎参与贡献。提交 pull request 之前，请先阅读[贡献指南](https://github.com/muhittincamdali/ReactNativeStorage/blob/main/CONTRIBUTING.md)和[行为准则](https://github.com/muhittincamdali/ReactNativeStorage/blob/main/CODE_OF_CONDUCT.md)。如发现安全问题，请按照[安全策略](https://github.com/muhittincamdali/ReactNativeStorage/blob/main/SECURITY.md)私下报告。

## 许可证

基于 MIT 许可证发布。详见 [LICENSE](LICENSE)。
