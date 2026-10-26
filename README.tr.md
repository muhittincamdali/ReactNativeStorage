<!-- i18n-source: README.md@a8d8f9cb1fb4fc7f873e2f3c9b86a6212fc6d79b status=reviewed -->
<!-- brand:start -->

<p align="center"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/banner-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/banner-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/banner-light.svg" alt="React Native Storage: Typed, validated key-value storage for React Native and Expo on MMKV, AsyncStorage or SecureStore."></picture></p>

<!-- lang-selector:start -->
<p align="center"><a href="README.md">English</a> · <a href="README.tr.md">Türkçe</a> · <a href="README.zh-CN.md">简体中文</a> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a> · <a href="README.es.md">Español</a> · <a href="README.de.md">Deutsch</a> · <a href="README.fr.md">Français</a> · <a href="README.pt-BR.md">Português (Brasil)</a> · <a href="README.ru.md">Русский</a></p>
<!-- lang-selector:end -->

<p align="center">
<a href="https://github.com/muhittincamdali/ReactNativeStorage/actions/workflows/ci.yml"><img src="https://github.com/muhittincamdali/ReactNativeStorage/actions/workflows/ci.yml/badge.svg" alt="CI durumu"></a>
<a href="https://github.com/muhittincamdali/ReactNativeStorage/releases"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-version-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-version-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-version-light.svg" alt="Son sürüm: v1.0.0"></picture></a>
<a href="https://github.com/muhittincamdali/ReactNativeStorage/blob/main/LICENSE"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-license-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-license-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-license-light.svg" alt="Lisans: MIT"></picture></a>
<a href="https://github.com/muhittincamdali/ReactNativeStorage/blob/main/package.json"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-framework-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-framework-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-framework-light.svg" alt="Dil sürümü: React 18+"></picture></a>
</p>

<p align="center">
<a href="#hızlı-başlangıç"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-start-tr-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-start-tr-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-start-tr-light.svg" alt="Başlayın"></picture></a>
<a href="https://github.com/muhittincamdali/ReactNativeStorage/blob/main/docs/guides/overview.md"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-docs-tr-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-docs-tr-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-docs-tr-light.svg" alt="Dokümantasyon"></picture></a>
<a href="https://github.com/muhittincamdali/ReactNativeStorage/tree/main/Examples"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-examples-tr-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-examples-tr-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-examples-tr-light.svg" alt="Örnekler"></picture></a>
</p>

> Bu belge İngilizce README'nin çevirisidir. İkisi arasında fark varsa güncel olan İngilizce sürümdür.

<!-- brand:end -->

React Native ve Expo uygulamalarında verileri cihazda saklamak için bir TypeScript kütüphanesi. Her değeri
bir kez tanımlarsınız: bir ad, bir varsayılan değer ve isteğe bağlı olarak bir şema, bir ömür ve bir sürüm. Sonra
değeri her yerden okuyup yazabilir ya da değiştiğinde yeniden render eden bir hook ile bir bileşende
gösterebilirsiniz. Baytları sizin seçtiğiniz bir driver saklar: MMKV, AsyncStorage, SecureStore,
`localStorage` veya bellek. Elle yazılmış `JSON.parse(await AsyncStorage.getItem(...))` çağrıları artık yetmeyen ve
saklanan verilerin doğrulanmasını, tiplenmesini ve uygulama sürümleri arasında yükseltilebilmesini
isteyen uygulamalar için tasarlanmıştır.

## Öne çıkanlar

- **Tipli ve doğrulanmış** — herhangi bir [Standard Schema](https://standardschema.dev) (Zod, Valibot,
  ArkType) ya da bir type guard, değerleri yazarken ve okurken denetler; öğenin tipi şemadan gelir.
- **Beş backend için tek API** — MMKV (senkron olduğundan hook'lar değeri ilk render'da alır),
  AsyncStorage, SecureStore (Keychain ve Keystore), `localStorage` ve bellek; hepsi aynı `get`, `set`,
  `remove` ve `useStorageItem` arkasında.
- **Uygulama güncellemelerinden sağ çıkan veri** — her kayıt bir şema sürümü taşır; migration'lar eski
  kayıtları adım adım yükseltir, bir `legacy` okuyucusu bu kütüphaneden önce yazılmış değerleri devralır ve
  uygulamanın daha yeni bir sürümünden gelen kayıtlara dokunulmaz.
- **Son kullanma** — öğe başına ya da yazma başına bir time to live; süresi dolmuş bir değeri gösteren
  bileşen, süre dolduğu anda varsayılan değere döner.
- **Uygulamayı çökertmeyen hatalar** — bozuk ya da geçersiz saklanmış veri varsayılan değeri döndürür ve
  `onError`'a ulaşır; hata mesajları anahtarı belirtir, değeri asla.
- **Test edilmiş** — 164 Vitest testi codec'i, doğrulamayı, migration'ları, TTL'i, eşzamanlı yazmaların
  sırasını, her driver'ı, hook'u ve yardımcıları kapsar; örnek uygulama, [`scripts/e2e-ios.sh`](scripts/e2e-ios.sh)
  ile bir iOS 27 simülatöründe gerçek MMKV ve Keychain'e karşı çalışır.

## Hızlı başlangıç

**1. Paketi ekleyin**

```sh
npm install github:muhittincamdali/ReactNativeStorage react-native-mmkv react-native-nitro-modules
```

Paket GitHub'dan kurulur. MMKV bir native modüldür: uygulamayı Expo Go'da değil, `npx expo run:ios` veya
`npx expo run:android` ile (bir development build olarak) çalıştırın.

**2. Modülü içe aktarın**

```tsx
import { createStorage, mmkvDriver } from 'react-native-storage-toolkit';
import { useStorageItem } from 'react-native-storage-toolkit/react';
```

**3. Kullanın**

[`Examples/StorageDemo/src/QuickStart.tsx`](Examples/StorageDemo/src/QuickStart.tsx) dosyasından alınan bu bileşen
basış sayısını sayar ve uygulama yeniden başlatıldıktan sonra da sayıyı göstermeye devam eder:

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

## Kurulum

Paket npm registry'sinde yok. npm, pnpm veya Yarn ile GitHub'dan kurun:

```sh
npm install github:muhittincamdali/ReactNativeStorage
```

TypeScript kaynaklarıyla gelir; Metro, Expo, Vitest ve `jest-expo` preset'i bunları doğrudan derler, kurulum
sırasında hiçbir şey çalışmaz. Ardından kullanmak istediğiniz backend'i ekleyin:

| Backend      | Kurulum                                                         | Driver                                          |
| ------------ | --------------------------------------------------------------- | ----------------------------------------------- |
| MMKV         | `npx expo install react-native-mmkv react-native-nitro-modules` | `mmkvDriver(createMMKV())`                      |
| AsyncStorage | `npx expo install @react-native-async-storage/async-storage`    | `asyncStorageDriver(AsyncStorage)`              |
| SecureStore  | `npx expo install expo-secure-store`                            | `secureStoreDriver(SecureStore, options)`       |
| Web Storage  | gerekmez                                                        | `webStorageDriver(window.localStorage, window)` |
| Memory       | gerekmez                                                        | `memoryDriver()`                                |

## Kullanım

Aşağıdaki örnekler, MMKV yerine bellek driver'ı kullanılarak [`test/readme.test.tsx`](test/readme.test.tsx)
tarafından derlenir ve çalıştırılır.

### Değerleri bir şemayla doğrulayın

Şema hem yazarken hem okurken çalışır. Geçersiz bir değer yazmak reddedilir ve hiçbir şey yazılmaz; saklanmış
geçersiz bir değeri okumak varsayılan değeri verir ve `onError`'ı çağırır.

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

### Bir değeri bileşende gösterin

`useStorageItem` değeri, bir değer ya da bir güncelleyici kabul eden bir setter'ı ve öğenin durumunu döndürür.
Öğeyi gösteren her bileşen, yazma nereden gelirse gelsin, yazmadan sonra yeniden render edilir.

```tsx
function ThemePicker() {
  const [value, setValue, { status, error }] = useStorageItem(theme);
  if (status === 'error') return <Text>Could not read the theme: {error?.code}</Text>;
  return <Button title={`Theme: ${value}`} onPress={() => setValue('dark')} />;
}
```

Asenkron bir driver'da (AsyncStorage, SecureStore) ilk render varsayılan değeri ve `status: 'loading'`
durumunu taşır.

### Değerlerin süresi dolsun

```ts
const draft = storage.item('draft', { defaultValue: '', ttl: 5 * 60 * 1000 });
await draft.set('Buy milk'); // gone five minutes later

const otp = storage.item<string>('otp');
await otp.set('482913', { ttl: 30_000 }); // a lifetime for one write
await storage.purgeExpired(); // removes every expired value in the namespace
```

### Saklanan verinin şeklini değiştirin

`version` değerini artırın ve her adım için bir migration ekleyin. Eski kayıtlar okunurken yükseltilir ve
yeni şekliyle kaydedilir.

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

### Bir token'ı Keychain'de tutun

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

`getOrCreateSecret(item)` rastgele bir anahtarı bir kez oluşturur ve sonrasında onu döndürür; örneğin bir MMKV
örneğini şifrelemek için. Bkz. [Token ve anahtarları güvende tutun](docs/guides/secure-values.md). Okuyamadığı kayıtlı bir değerin üzerine asla yazmaz: bozuk, geçersiz ya da süresi dolmuş veri `StorageError` ile reddedilir ve olduğu gibi kalır.

### Bir Zustand store'unu kalıcı kılın

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

Aynı adaptör Jotai, Redux Persist ve TanStack Query persister'larıyla da çalışır.

## Demo

[`Examples/StorageDemo`](Examples/StorageDemo), yukarıdaki tüm özellikleri gerçek MMKV ve SecureStore ile
kullanan bir Expo SDK 58 uygulamasıdır (React Native 0.88): bir sayaç, Zod ile doğrulanan bir tema, beş dakikalık
TTL'li bir taslak, 1. sürümden migrate edilen bir profil ve `expo-crypto` ile oluşturulup Keychain'de tutulan bir
token. Aşağıdaki ekranlar, uygulamayı bir iPhone simülatörüne kuran ve ekran görüntülerini alan
[`scripts/capture-screenshots.sh`](scripts/capture-screenshots.sh) betiğinden gelir.

| Açık                                                                            | Koyu                                                                          |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| ![Storage Demo, ekranın üst kısmı, açık](docs/images/demo-top-light.png)       | ![Storage Demo, ekranın üst kısmı, koyu](docs/images/demo-top-dark.png)       |
| ![Storage Demo, ekranın alt kısmı, açık](docs/images/demo-bottom-light.png) | ![Storage Demo, ekranın alt kısmı, koyu](docs/images/demo-bottom-dark.png) |

Kendiniz çalıştırın:

```sh
cd Examples/StorageDemo
npm install
npx expo run:ios      # or: npx expo run:android, npx expo start --web
```

## Dokümantasyon

API başvuru belgeleri ve makaleler:

- API başvurusu — tüm export'lar; kaynaklardan TypeDoc ile üretilir (`npm run docs` yerel olarak
  `docs/api` içine üretir). [Docs iş akışı](.github/workflows/docs.yml) bunu `main` dalından GitHub Pages'te yayımlar.
- [Hata kodları](src/errors.ts) — her `StorageError` kodunun ne anlama geldiği.

## Rehberler

- [AsyncStorage'dan MMKV'ye geçin](docs/guides/migrating-from-async-storage.md) — eski anahtarları bir kez
  kopyalayın ve `legacy` üzerinden okuyun.
- [Saklanan verinin şeklini değiştirin](docs/guides/schemas-and-migrations.md) — şemalar, sürümler ve
  migration'lar ile codec'in hangi değerleri koruduğu.
- [Token ve anahtarları güvende tutun](docs/guides/secure-values.md) — SecureStore ve MMKV için bir
  şifreleme anahtarı.
- [Storage kullanan kodu test edin](docs/guides/testing.md) — bellek driver'ı, kontrollü bir saat ve Jest
  ayarları.

## Gereksinimler

| Araç zinciri                                | En düşük sürüm                              |
| ------------------------------------------- | ------------------------------------------- |
| React                                       | 18 (`useSyncExternalStore` için)            |
| TypeScript, tip denetimi yapıyorsanız       | 5.0                                         |
| react-native-mmkv, `mmkvDriver` için        | 3 (4. sürüm React Native 0.76 gerektirir)   |
| Node.js, bu depoda çalışmak için            | 22.12                                       |

Örnek uygulama ve uçtan uca betik Expo SDK 58, React Native 0.88, Xcode 27 ve iOS 27 simülatörüyle test
edilmiştir.

## Mimari

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

Bir katkıcının bilmesi gereken kararlar:

- Driver'lar uygulamanın oluşturduğu bir örneği uyarlar ve onu şekline göre eşleştirir; böylece paketin
  çalışma zamanı bağımlılığı yoktur ve her backend'in birkaç sürümünü destekler.
- Okumalar kötü veri için asla hata fırlatmaz, yalnızca başarısız bir driver için fırlatır; yazmalar reddedilir
  ve hiçbir şey yazmaz.
- Key store bir yazmayı hemen gösterir ve bir anahtara yapılan yazmaları çağrı sırasıyla gönderir; en yeni
  yazma başarısız olursa backend'in son onayladığı değere döner.
- Her sınır uç noktada denetlenir: anahtar uzunluğu ve karakterleri, UTF-8 bayt cinsinden değer boyutu, iç içe
  geçme derinliği, şema sürümleri, TTL'ler (sonlu ve güvenli tamsayı aralığında) ve zamanlayıcı gecikmeleri
  (en çok 2^31-1 ms).

## Yol haritası

Sıradaki planlar, [issue tracker](https://github.com/muhittincamdali/ReactNativeStorage/issues) üzerinden izlenir:

- paketi npm registry'sinde yayımlamak;
- uçtan uca betiğin CI'da bir Android emülatöründe çalıştırılması;
- SecureStore için isteğe bağlı bir anahtar dizini; böylece `clear()` oturum kapatırken her sırrı silebilir.

## Katkıda bulunma

Katkılarınızı bekliyoruz. Pull request açmadan önce [katkı rehberini](https://github.com/muhittincamdali/ReactNativeStorage/blob/main/CONTRIBUTING.md) ve [davranış kurallarını](https://github.com/muhittincamdali/ReactNativeStorage/blob/main/CODE_OF_CONDUCT.md) okuyun. Güvenlik açıklarını [güvenlik politikasında](https://github.com/muhittincamdali/ReactNativeStorage/blob/main/SECURITY.md) anlatıldığı gibi gizli olarak bildirin.

## Lisans

MIT lisansıyla yayımlanmıştır. Ayrıntılar için [LICENSE](LICENSE) dosyasına bakın.
