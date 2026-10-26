<!-- i18n-source: README.md@5cce8b18fbbe77cdfe1e2e6a4f1fb2f0ccbcb3bf status=reviewed -->
<!-- brand:start -->

<p align="center"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/banner-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/banner-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/banner-light.svg" alt="React Native Storage: Typed, validated key-value storage for React Native and Expo on MMKV, AsyncStorage or SecureStore."></picture></p>

<!-- lang-selector:start -->
<p align="center"><a href="README.md">English</a> · <a href="README.tr.md">Türkçe</a> · <a href="README.zh-CN.md">简体中文</a> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a> · <a href="README.es.md">Español</a> · <a href="README.de.md">Deutsch</a> · <a href="README.fr.md">Français</a> · <a href="README.pt-BR.md">Português (Brasil)</a> · <a href="README.ru.md">Русский</a></p>
<!-- lang-selector:end -->

<p align="center">
<a href="https://github.com/muhittincamdali/ReactNativeStorage/actions/workflows/ci.yml"><img src="https://github.com/muhittincamdali/ReactNativeStorage/actions/workflows/ci.yml/badge.svg" alt="État de la CI"></a>
<a href="https://github.com/muhittincamdali/ReactNativeStorage/releases"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-version-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-version-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-version-light.svg" alt="Dernière version: v2.0.0"></picture></a>
<a href="https://github.com/muhittincamdali/ReactNativeStorage/blob/main/LICENSE"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-license-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-license-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-license-light.svg" alt="Licence: MIT"></picture></a>
<a href="https://github.com/muhittincamdali/ReactNativeStorage/blob/main/package.json"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-framework-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-framework-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-framework-light.svg" alt="Version du langage: React 18+"></picture></a>
</p>

<p align="center">
<a href="#démarrage-rapide"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-start-fr-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-start-fr-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-start-fr-light.svg" alt="Commencer"></picture></a>
<a href="https://github.com/muhittincamdali/ReactNativeStorage/blob/main/docs/guides/overview.md"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-docs-fr-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-docs-fr-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-docs-fr-light.svg" alt="Documentation"></picture></a>
<a href="https://github.com/muhittincamdali/ReactNativeStorage/tree/main/Examples"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-examples-fr-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-examples-fr-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-examples-fr-light.svg" alt="Exemples"></picture></a>
</p>

> Ceci est une traduction du README anglais. En cas de différence, la version anglaise fait foi.

<!-- brand:end -->

Une bibliothèque TypeScript pour conserver les données d’une application sur l’appareil dans les apps React Native et Expo. Vous déclarez chaque valeur une seule fois, avec un nom, une valeur par défaut et, en option, un schéma, une durée de vie et une version ; ensuite, vous la lisez et l’écrivez de n’importe où, ou vous l’affichez dans un composant grâce à un hook qui se re-rend quand elle change. Les octets sont stockés par un driver de votre choix : MMKV, AsyncStorage, SecureStore, `localStorage` ou la mémoire. Elle s’adresse aux applications qui ont dépassé les appels écrits à la main comme `JSON.parse(await AsyncStorage.getItem(...))` et qui veulent que les données stockées soient vérifiées, typées et mises à niveau d’une version de l’app à l’autre.

## Points forts

- **Typé et validé** — tout [Standard Schema](https://standardschema.dev) (Zod, Valibot, ArkType) ou un type guard vérifie les valeurs à l’écriture et à la lecture ; le type de l’élément vient du schéma.
- **Une seule API pour cinq backends** — MMKV (synchrone, donc les hooks ont la valeur dès le premier rendu), AsyncStorage, SecureStore (Keychain et Keystore), `localStorage` et la mémoire, derrière les mêmes `get`, `set`, `remove` et `useStorageItem`.
- **Des données qui survivent aux mises à jour de l’app** — chaque enregistrement porte une version de schéma ; les migrations mettent à niveau les anciens enregistrements pas à pas, un lecteur `legacy` reprend les valeurs écrites avant cette bibliothèque, et les enregistrements d’une version plus récente de l’app ne sont pas modifiés.
- **Expiration** — un time to live par élément ou par écriture ; un composant qui affiche une valeur expirée revient à la valeur par défaut au moment même où elle expire.
- **Des erreurs qui ne font pas planter l’app** — des données stockées corrompues ou invalides renvoient la valeur par défaut et parviennent à `onError` ; les messages d’erreur nomment la clé, jamais la valeur.
- **Testé** — 164 tests Vitest couvrent le codec, la validation, les migrations, le TTL, l’ordre des écritures concurrentes, chaque driver, le hook et les helpers ; l’app d’exemple s’exécute sur un simulateur iOS 27 avec le vrai MMKV et le vrai Keychain dans [`scripts/e2e-ios.sh`](scripts/e2e-ios.sh).

## Démarrage rapide

**1. Ajouter le paquet**

```sh
npm install github:muhittincamdali/ReactNativeStorage react-native-mmkv react-native-nitro-modules
```

Le paquet s’installe depuis GitHub. MMKV est un module natif : lancez l’app avec `npx expo run:ios` ou `npx expo run:android` (un development build), pas dans Expo Go.

**2. Importer le module**

```tsx
import { createStorage, mmkvDriver } from 'react-native-storage-toolkit';
import { useStorageItem } from 'react-native-storage-toolkit/react';
```

**3. L’utiliser**

Ce composant, tiré de [`Examples/StorageDemo/src/QuickStart.tsx`](Examples/StorageDemo/src/QuickStart.tsx), compte les appuis et affiche toujours le compte après le redémarrage de l’app :

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

## Installation

Le paquet n’est pas sur le registre npm. Installez-le depuis GitHub avec npm, pnpm ou Yarn :

```sh
npm install github:muhittincamdali/ReactNativeStorage
```

Il est livré avec ses sources TypeScript, que Metro, Expo, Vitest et le preset `jest-expo` compilent directement ; rien ne s’exécute à l’installation. Ajoutez ensuite le backend que vous voulez utiliser :

| Backend      | Installation                                                    | Driver                                          |
| ------------ | --------------------------------------------------------------- | ----------------------------------------------- |
| MMKV         | `npx expo install react-native-mmkv react-native-nitro-modules` | `mmkvDriver(createMMKV())`                      |
| AsyncStorage | `npx expo install @react-native-async-storage/async-storage`    | `asyncStorageDriver(AsyncStorage)`              |
| SecureStore  | `npx expo install expo-secure-store`                            | `secureStoreDriver(SecureStore, options)`       |
| Web Storage  | rien                                                            | `webStorageDriver(window.localStorage, window)` |
| Memory       | rien                                                            | `memoryDriver()`                                |

## Utilisation

Les exemples ci-dessous sont compilés et exécutés par [`test/readme.test.tsx`](test/readme.test.tsx), avec le driver mémoire à la place de MMKV.

### Vérifier les valeurs avec un schéma

Le schéma s’exécute à l’écriture et à la lecture. Écrire une valeur invalide est rejeté et n’écrit rien ; lire une valeur stockée invalide renvoie la valeur par défaut et appelle `onError`.

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

### Afficher une valeur dans un composant

`useStorageItem` renvoie la valeur, un setter qui accepte une valeur ou une fonction de mise à jour, et l’état de l’élément. Chaque composant qui affiche l’élément se re-rend après une écriture, d’où qu’elle vienne.

```tsx
function ThemePicker() {
  const [value, setValue, { status, error }] = useStorageItem(theme);
  if (status === 'error') return <Text>Could not read the theme: {error?.code}</Text>;
  return <Button title={`Theme: ${value}`} onPress={() => setValue('dark')} />;
}
```

Avec un driver asynchrone (AsyncStorage, SecureStore), le premier rendu a la valeur par défaut et `status: 'loading'`.

### Faire expirer des valeurs

```ts
const draft = storage.item('draft', { defaultValue: '', ttl: 5 * 60 * 1000 });
await draft.set('Buy milk'); // gone five minutes later

const otp = storage.item<string>('otp');
await otp.set('482913', { ttl: 30_000 }); // a lifetime for one write
await storage.purgeExpired(); // removes every expired value in the namespace
```

### Changer la forme des données stockées

Augmentez `version` et ajoutez une migration par étape. Les anciens enregistrements sont mis à niveau à la lecture et enregistrés sous la nouvelle forme.

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

### Conserver un token dans le Keychain

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

`getOrCreateSecret(item)` crée une clé aléatoire une seule fois, puis la renvoie ensuite, par exemple pour chiffrer une instance MMKV ; voir [Garder les tokens et les clés en sécurité](docs/guides/secure-values.md). Elle n’écrase jamais une valeur stockée qu’elle ne peut pas utiliser : des données corrompues, invalides ou expirées sont rejetées avec une `StorageError` et restent en place.

### Persister un store Zustand

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

Le même adaptateur fonctionne avec Jotai, Redux Persist et les persisters de TanStack Query.

## Démo

[`Examples/StorageDemo`](Examples/StorageDemo) est une app Expo SDK 58 (React Native 0.88) qui utilise toutes les fonctionnalités ci-dessus avec le vrai MMKV et SecureStore : un compteur, un thème vérifié par Zod, un brouillon avec un TTL de cinq minutes, un profil migré depuis la version 1, et un token créé avec `expo-crypto` et conservé dans le Keychain. Les écrans ci-dessous viennent de [`scripts/capture-screenshots.sh`](scripts/capture-screenshots.sh), qui installe l’app sur un simulateur d’iPhone et la capture.

| Clair                                                                           | Sombre                                                                        |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| ![Storage Demo, haut de l’écran, clair](docs/images/demo-top-light.png)       | ![Storage Demo, haut de l’écran, sombre](docs/images/demo-top-dark.png)       |
| ![Storage Demo, bas de l’écran, clair](docs/images/demo-bottom-light.png) | ![Storage Demo, bas de l’écran, sombre](docs/images/demo-bottom-dark.png) |

Lancez-le vous-même :

```sh
cd Examples/StorageDemo
npm install
npx expo run:ios      # or: npx expo run:android, npx expo start --web
```

## Documentation

Référence de l’API et articles :

- Référence de l’API — chaque export, générée avec TypeDoc à partir des sources (`npm run docs` la génère en local dans `docs/api`) ; le [workflow Docs](.github/workflows/docs.yml) la publie sur GitHub Pages depuis `main`.
- [Codes d’erreur](src/errors.ts) — ce que signifie chaque code de `StorageError`.

## Guides

- [Passer d’AsyncStorage à MMKV](docs/guides/migrating-from-async-storage.md) — copier une fois les anciennes clés et les lire via `legacy`.
- [Changer la forme des données stockées](docs/guides/schemas-and-migrations.md) — schémas, versions et migrations, et les valeurs que le codec conserve.
- [Garder les tokens et les clés en sécurité](docs/guides/secure-values.md) — SecureStore et une clé de chiffrement pour MMKV.
- [Tester du code qui utilise le stockage](docs/guides/testing.md) — le driver mémoire, une horloge contrôlée et les réglages de Jest.

## Prérequis

| Chaîne d’outils                     | Version minimale                      |
| ----------------------------------- | ------------------------------------- |
| React                               | 18 (pour `useSyncExternalStore`)      |
| TypeScript, si vous vérifiez les types | 5.0                                |
| react-native-mmkv, pour `mmkvDriver` | 3 (la version 4 nécessite React Native 0.76) |
| Node.js, pour travailler sur ce dépôt | 22.12                               |

L’app d’exemple et le script de bout en bout sont testés avec Expo SDK 58, React Native 0.88, Xcode 27 et le simulateur iOS 27.

## Architecture

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

Les choix qu’un contributeur doit connaître :

- Les drivers adaptent une instance créée par l’app et la reconnaissent à sa forme ; le paquet n’a donc aucune dépendance d’exécution et prend en charge plusieurs versions de chaque backend.
- Les lectures ne lèvent jamais d’erreur pour des données incorrectes, seulement pour un driver défaillant ; les écritures sont rejetées et n’écrivent rien.
- Le key store affiche une écriture immédiatement et envoie les écritures d’une même clé dans l’ordre des appels ; si l’écriture la plus récente échoue, il revient à la dernière valeur confirmée par le backend.
- Chaque limite est vérifiée à la frontière : longueur et caractères de la clé, taille de la valeur en octets UTF-8, profondeur d’imbrication, versions de schéma, TTL (finis et dans la plage des entiers sûrs) et délais des minuteries (au plus 2^31-1 ms).

## Feuille de route

Prévu ensuite, suivi dans l’[issue tracker](https://github.com/muhittincamdali/ReactNativeStorage/issues) :

- publier le paquet sur le registre npm ;
- une exécution du script de bout en bout sur un émulateur Android en CI ;
- un index de clés facultatif pour SecureStore, afin que `clear()` puisse supprimer tous les secrets à la déconnexion.

## Contribuer

Les contributions sont les bienvenues. Lisez le [guide de contribution](https://github.com/muhittincamdali/ReactNativeStorage/blob/main/CONTRIBUTING.md) et le [code de conduite](https://github.com/muhittincamdali/ReactNativeStorage/blob/main/CODE_OF_CONDUCT.md) avant d’ouvrir une pull request. Signalez les problèmes de sécurité en privé, comme indiqué dans la [politique de sécurité](https://github.com/muhittincamdali/ReactNativeStorage/blob/main/SECURITY.md).

## Licence

Publié sous licence MIT. Voir [LICENSE](LICENSE).
