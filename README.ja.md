<!-- i18n-source: README.md@f64eb29021b63ba1b4ae1313e04c15e34cf1042a status=reviewed -->
<!-- brand:start -->

<p align="center"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/banner-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/banner-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/banner-light.svg" alt="React Native Storage: Typed, validated key-value storage for React Native and Expo on MMKV, AsyncStorage or SecureStore."></picture></p>

<!-- lang-selector:start -->
<p align="center"><a href="README.md">English</a> · <a href="README.tr.md">Türkçe</a> · <a href="README.zh-CN.md">简体中文</a> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a> · <a href="README.es.md">Español</a> · <a href="README.de.md">Deutsch</a> · <a href="README.fr.md">Français</a> · <a href="README.pt-BR.md">Português (Brasil)</a> · <a href="README.ru.md">Русский</a></p>
<!-- lang-selector:end -->

<p align="center">
<a href="https://github.com/muhittincamdali/ReactNativeStorage/actions/workflows/ci.yml"><img src="https://github.com/muhittincamdali/ReactNativeStorage/actions/workflows/ci.yml/badge.svg" alt="CI ステータス"></a>
<a href="https://github.com/muhittincamdali/ReactNativeStorage/releases"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-version-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-version-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-version-light.svg" alt="最新バージョン: v1.0.0"></picture></a>
<a href="https://github.com/muhittincamdali/ReactNativeStorage/blob/main/LICENSE"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-license-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-license-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-license-light.svg" alt="ライセンス: MIT"></picture></a>
<a href="https://github.com/muhittincamdali/ReactNativeStorage/blob/main/package.json"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-framework-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-framework-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-framework-light.svg" alt="言語バージョン: React 18+"></picture></a>
</p>

<p align="center">
<a href="#クイックスタート"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-start-ja-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-start-ja-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-start-ja-light.svg" alt="はじめる"></picture></a>
<a href="https://muhittincamdali.github.io/ReactNativeStorage/"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-docs-ja-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-docs-ja-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-docs-ja-light.svg" alt="ドキュメント"></picture></a>
<a href="https://github.com/muhittincamdali/ReactNativeStorage/tree/main/Examples"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-examples-ja-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-examples-ja-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-examples-ja-light.svg" alt="サンプル"></picture></a>
</p>

> このドキュメントは英語版 README の翻訳です。内容が異なる場合は英語版が最新です。

<!-- brand:end -->

React Native と Expo アプリで、アプリのデータを端末に保存するための TypeScript ライブラリです。値ごとに名前とデフォルト値、必要であればスキーマ、有効期間、バージョンを一度だけ宣言すれば、どこからでも読み書きでき、値が変わると再レンダリングされる hook でコンポーネントに表示することもできます。データの保存は、選択した driver（MMKV、AsyncStorage、SecureStore、`localStorage`、メモリ）が行います。手書きの `JSON.parse(await AsyncStorage.getItem(...))` では手に負えなくなり、保存データを検証し、型を付け、アプリのバージョンをまたいでアップグレードできるようにしたいアプリ向けです。

## 主な特長

- **型付きで検証済み** — 任意の [Standard Schema](https://standardschema.dev)（Zod、Valibot、ArkType）または type guard が、書き込み時と読み取り時に値を検査します。アイテムの型はスキーマから決まります。
- **5 つのバックエンドに対して 1 つの API** — MMKV（同期的なので、hook は最初のレンダリングから値を持てます）、AsyncStorage、SecureStore（Keychain と Keystore）、`localStorage`、メモリを、同じ `get`、`set`、`remove`、`useStorageItem` で扱えます。
- **アプリのアップデートを越えて残るデータ** — すべてのレコードにスキーマバージョンが付きます。migration が古いレコードを段階的にアップグレードし、`legacy` リーダーがこのライブラリ導入前に書き込まれた値を引き継ぎ、より新しいバージョンのアプリが書いたレコードには手を加えません。
- **有効期限** — アイテムごと、または書き込みごとの time to live を設定できます。期限切れの値を表示しているコンポーネントは、期限が切れた瞬間にデフォルト値へ戻ります。
- **アプリをクラッシュさせない失敗処理** — 壊れた、または無効な保存データはデフォルト値を返し、`onError` に通知されます。エラーメッセージに含まれるのはキーのみで、値は含まれません。
- **テスト済み** — 159 個の Vitest テストが、codec、検証、migration、TTL、同時書き込みの順序、すべての driver、hook、ヘルパーをカバーします。サンプルアプリは [`scripts/e2e-ios.sh`](scripts/e2e-ios.sh) により、iOS 27 シミュレータ上で本物の MMKV と Keychain を使って動作確認されています。

## クイックスタート

**1. パッケージを追加する**

```sh
npm install github:muhittincamdali/ReactNativeStorage react-native-mmkv react-native-nitro-modules
```

パッケージは GitHub からインストールします。MMKV はネイティブモジュールなので、Expo Go ではなく、`npx expo run:ios` または `npx expo run:android`（development build）でアプリを実行してください。

**2. モジュールをインポートする**

```tsx
import { createStorage, mmkvDriver } from 'react-native-storage-toolkit';
import { useStorageItem } from 'react-native-storage-toolkit/react';
```

**3. 使ってみる**

次のコンポーネントは [`Examples/StorageDemo/src/QuickStart.tsx`](Examples/StorageDemo/src/QuickStart.tsx) のもので、ボタンを押した回数を数え、アプリを再起動してもその回数を表示し続けます。

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

## インストール

このパッケージは npm レジストリにはありません。npm、pnpm、Yarn のいずれかで GitHub からインストールしてください。

```sh
npm install github:muhittincamdali/ReactNativeStorage
```

TypeScript のソースのまま配布されており、Metro、Expo、Vitest、`jest-expo` プリセットがそのままコンパイルします。インストール時に実行される処理はありません。続いて、使いたいバックエンドを追加します。

| バックエンド | インストール | Driver |
| ------------ | --------------------------------------------------------------- | ----------------------------------------------- |
| MMKV         | `npx expo install react-native-mmkv react-native-nitro-modules` | `mmkvDriver(createMMKV())`                      |
| AsyncStorage | `npx expo install @react-native-async-storage/async-storage`    | `asyncStorageDriver(AsyncStorage)`              |
| SecureStore  | `npx expo install expo-secure-store`                            | `secureStoreDriver(SecureStore, options)`       |
| Web Storage  | 不要                                                            | `webStorageDriver(window.localStorage, window)` |
| Memory       | 不要                                                            | `memoryDriver()`                                |

## 使い方

以下のサンプルは、MMKV の代わりにメモリ driver を使って、[`test/readme.test.ts`](test/readme.test.ts) がコンパイルして実行しています。

### スキーマで値を検証する

スキーマは書き込み時にも読み取り時にも実行されます。無効な値を書き込もうとすると拒否され、何も書き込まれません。保存されている無効な値を読み取ると、デフォルト値が返され、`onError` が呼ばれます。

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

### コンポーネントに値を表示する

`useStorageItem` は、値、値またはアップデータ関数を受け取る setter、そしてアイテムの状態を返します。そのアイテムを表示しているコンポーネントはすべて、書き込みがどこから行われても、書き込み後に再レンダリングされます。

```tsx
function ThemePicker() {
  const [value, setValue, { status, error }] = useStorageItem(theme);
  if (status === 'error') return <Text>Could not read the theme: {error?.code}</Text>;
  return <Button title={`Theme: ${value}`} onPress={() => setValue('dark')} />;
}
```

非同期の driver（AsyncStorage、SecureStore）では、最初のレンダリングはデフォルト値と `status: 'loading'` になります。

### 値を期限切れにする

```ts
const draft = storage.item('draft', { defaultValue: '', ttl: 5 * 60 * 1000 });
await draft.set('Buy milk'); // gone five minutes later

const otp = storage.item<string>('otp');
await otp.set('482913', { ttl: 30_000 }); // a lifetime for one write
await storage.purgeExpired(); // removes every expired value in the namespace
```

### 保存データの形を変更する

`version` を上げ、ステップごとに migration を追加します。古いレコードは読み取り時にアップグレードされ、新しい形で保存されます。

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

### トークンを Keychain に保存する

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

`getOrCreateSecret(item)` はランダムなキーを一度だけ作成し、以降はそれを返します。たとえば MMKV インスタンスの暗号化に使えます。詳しくは[トークンとキーを安全に保つ](docs/guides/secure-values.md)を参照してください。使えない保存済みの値を上書きすることはありません。破損した値、無効な値、期限切れの値は `StorageError` で拒否され、そのまま残ります。

### Zustand ストアを永続化する

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

同じアダプターは、Jotai、Redux Persist、TanStack Query の persister でも使えます。

## デモ

[`Examples/StorageDemo`](Examples/StorageDemo) は、Expo SDK 58（React Native 0.88）のアプリで、上記のすべての機能を本物の MMKV と SecureStore で使っています。カウンター、Zod で検証されるテーマ、TTL が 5 分の下書き、バージョン 1 から migration されるプロフィール、そして `expo-crypto` で作成して Keychain に保存するトークンです。以下の画面は [`scripts/capture-screenshots.sh`](scripts/capture-screenshots.sh) で撮影したもので、このスクリプトは iPhone シミュレータにアプリをインストールしてキャプチャします。

| ライト                                                                          | ダーク                                                                        |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| ![Storage Demo、画面上部、ライト](docs/images/demo-top-light.png)       | ![Storage Demo、画面上部、ダーク](docs/images/demo-top-dark.png)       |
| ![Storage Demo、画面下部、ライト](docs/images/demo-bottom-light.png) | ![Storage Demo、画面下部、ダーク](docs/images/demo-bottom-dark.png) |

自分で実行してみましょう。

```sh
cd Examples/StorageDemo
npm install
npx expo run:ios      # or: npx expo run:android, npx expo start --web
```

## ドキュメント

API リファレンスと解説記事：

- [API リファレンス](https://muhittincamdali.github.io/ReactNativeStorage/) — すべてのエクスポート。ソースから TypeDoc で生成します（`npm run docs` でローカルの `docs/api` に生成されます）。
- [エラーコード](src/errors.ts) — `StorageError` の各コードの意味。

## ガイド

- [AsyncStorage から MMKV へ移行する](docs/guides/migrating-from-async-storage.md) — 古いキーを一度だけコピーし、`legacy` 経由で読み取ります。
- [保存データの形を変更する](docs/guides/schemas-and-migrations.md) — スキーマ、バージョン、migration、そして codec が保持する値。
- [トークンとキーを安全に保つ](docs/guides/secure-values.md) — SecureStore と、MMKV の暗号化キー。
- [ストレージを使うコードをテストする](docs/guides/testing.md) — メモリ driver、制御可能なクロック、Jest の設定。

## 動作要件

| ツールチェーン | 最小バージョン |
| ----------------------------------- | ------------------------------------- |
| React                               | 18（`useSyncExternalStore` のため）     |
| TypeScript（型チェックする場合）    | 5.0                                   |
| react-native-mmkv（`mmkvDriver` 用） | 3（バージョン 4 は React Native 0.76 が必要） |
| Node.js（このリポジトリで開発する場合） | 22.12                             |

サンプルアプリとエンドツーエンドのスクリプトは、Expo SDK 58、React Native 0.88、Xcode 27、iOS 27 シミュレータでテストしています。

## アーキテクチャ

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

コントリビューターが知っておくべき設計上の判断：

- driver は、アプリが作成したインスタンスをラップし、その形で照合します。そのためパッケージにはランタイム依存がなく、各バックエンドの複数のバージョンに対応できます。
- 読み取りは、不正なデータでは例外を投げず、driver 自体が失敗したときだけ投げます。書き込みは拒否され、何も書き込まれません。
- key store は書き込みをすぐに反映し、同じキーへの書き込みを呼び出し順に送ります。最新の書き込みが失敗した場合は、バックエンドが最後に確認した値に戻ります。
- すべての制限は境界で検査されます。キーの長さと文字、UTF-8 バイト数での値のサイズ、ネストの深さ、スキーマバージョン、TTL（有限で、安全な整数の範囲内）、タイマーの遅延（最大 2^31-1 ms）です。

## ロードマップ

今後の予定は [issue tracker](https://github.com/muhittincamdali/ReactNativeStorage/issues) で管理しています。

- パッケージを npm レジストリに公開する
- CI で Android エミュレータ上のエンドツーエンドスクリプトを実行する
- SecureStore 用のオプションのキーインデックス（サインアウト時に `clear()` ですべてのシークレットを削除できるようにするため）

## コントリビューション

コントリビューションを歓迎します。pull request を作成する前に[コントリビューションガイド](https://github.com/muhittincamdali/ReactNativeStorage/blob/main/CONTRIBUTING.md)と[行動規範](https://github.com/muhittincamdali/ReactNativeStorage/blob/main/CODE_OF_CONDUCT.md)をお読みください。セキュリティ上の問題は[セキュリティポリシー](https://github.com/muhittincamdali/ReactNativeStorage/blob/main/SECURITY.md)に従って非公開で報告してください。

## ライセンス

MIT ライセンスで公開しています。詳細は [LICENSE](LICENSE) を参照してください。
