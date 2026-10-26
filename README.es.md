<!-- i18n-source: README.md@0e2a31d7dd488f1ed9a4008e59f99d1d28f823f5 status=reviewed -->
<!-- brand:start -->

<p align="center"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/banner-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/banner-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/banner-light.svg" alt="React Native Storage: Typed, validated key-value storage for React Native and Expo on MMKV, AsyncStorage or SecureStore."></picture></p>

<!-- lang-selector:start -->
<p align="center"><a href="README.md">English</a> · <a href="README.tr.md">Türkçe</a> · <a href="README.zh-CN.md">简体中文</a> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a> · <a href="README.es.md">Español</a> · <a href="README.de.md">Deutsch</a> · <a href="README.fr.md">Français</a> · <a href="README.pt-BR.md">Português (Brasil)</a> · <a href="README.ru.md">Русский</a></p>
<!-- lang-selector:end -->

<p align="center">
<a href="https://github.com/muhittincamdali/ReactNativeStorage/actions/workflows/ci.yml"><img src="https://github.com/muhittincamdali/ReactNativeStorage/actions/workflows/ci.yml/badge.svg" alt="Estado de CI"></a>
<a href="https://github.com/muhittincamdali/ReactNativeStorage/releases"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-version-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-version-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-version-light.svg" alt="Última versión: v1.0.0"></picture></a>
<a href="https://github.com/muhittincamdali/ReactNativeStorage/blob/main/LICENSE"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-license-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-license-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-license-light.svg" alt="Licencia: MIT"></picture></a>
<a href="https://github.com/muhittincamdali/ReactNativeStorage/blob/main/package.json"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-framework-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-framework-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-framework-light.svg" alt="Versión del lenguaje: React 18+"></picture></a>
</p>

<p align="center">
<a href="#inicio-rápido"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-start-es-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-start-es-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-start-es-light.svg" alt="Empezar"></picture></a>
<a href="https://muhittincamdali.github.io/ReactNativeStorage/"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-docs-es-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-docs-es-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-docs-es-light.svg" alt="Documentación"></picture></a>
<a href="https://github.com/muhittincamdali/ReactNativeStorage/tree/main/Examples"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-examples-es-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-examples-es-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-examples-es-light.svg" alt="Ejemplos"></picture></a>
</p>

> Esta es una traducción del README en inglés. Si hay diferencias, la versión en inglés es la vigente.

<!-- brand:end -->

Una librería de TypeScript para guardar los datos de la app en el dispositivo en aplicaciones de React Native y Expo. Declaras cada valor una sola vez, con un nombre, un valor por defecto y, opcionalmente, un esquema, una vida útil y una versión; después lo lees y lo escribes desde cualquier parte, o lo muestras en un componente con un hook que se vuelve a renderizar cuando cambia. Los bytes los guarda un driver que tú eliges: MMKV, AsyncStorage, SecureStore, `localStorage` o memoria. Es para apps que se han quedado pequeñas con las llamadas escritas a mano `JSON.parse(await AsyncStorage.getItem(...))` y quieren que los datos guardados estén comprobados, tipados y se puedan actualizar entre versiones de la app.

## Lo más destacado

- **Tipado y validado** — cualquier [Standard Schema](https://standardschema.dev) (Zod, Valibot, ArkType) o un type guard comprueba los valores al escribir y al leer; el tipo del elemento sale del esquema.
- **Una sola API para cinco backends** — MMKV (síncrono, así que los hooks tienen el valor en el primer render), AsyncStorage, SecureStore (Keychain y Keystore), `localStorage` y memoria, detrás de los mismos `get`, `set`, `remove` y `useStorageItem`.
- **Datos que sobreviven a las actualizaciones de la app** — cada registro lleva una versión de esquema; las migrations actualizan los registros antiguos paso a paso, un lector `legacy` adopta los valores escritos antes de esta librería y los registros de una versión más reciente de la app no se tocan.
- **Caducidad** — un time to live por elemento o por escritura; un componente que muestra un valor caducado vuelve al valor por defecto en el momento en que caduca.
- **Fallos que no hacen caer la app** — los datos guardados corruptos o no válidos devuelven el valor por defecto y llegan a `onError`; los mensajes de error nombran la clave, nunca el valor.
- **Probado** — 151 tests de Vitest cubren el codec, la validación, las migrations, el TTL, el orden de las escrituras concurrentes, cada driver, el hook y los helpers; la app de ejemplo se ejecuta en un simulador de iOS 27 con el MMKV y el Keychain reales en [`scripts/e2e-ios.sh`](scripts/e2e-ios.sh).

## Inicio rápido

**1. Añade el paquete**

```sh
npm install github:muhittincamdali/ReactNativeStorage react-native-mmkv react-native-nitro-modules
```

El paquete se instala desde GitHub. MMKV es un módulo nativo: ejecuta la app con `npx expo run:ios` o `npx expo run:android` (un development build), no en Expo Go.

**2. Importa el módulo**

```tsx
import { createStorage, mmkvDriver } from 'react-native-storage-toolkit';
import { useStorageItem } from 'react-native-storage-toolkit/react';
```

**3. Úsalo**

Este componente, de [`Examples/StorageDemo/src/QuickStart.tsx`](Examples/StorageDemo/src/QuickStart.tsx), cuenta las pulsaciones y sigue mostrando la cuenta después de reiniciar la app:

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

## Instalación

El paquete no está en el registro de npm. Instálalo desde GitHub con npm, pnpm o Yarn:

```sh
npm install github:muhittincamdali/ReactNativeStorage
```

Se distribuye con el código fuente en TypeScript, que Metro, Expo, Vitest y el preset `jest-expo` compilan directamente; no se ejecuta nada durante la instalación. Después añade el backend que quieras usar:

| Backend      | Instalación                                                     | Driver                                          |
| ------------ | --------------------------------------------------------------- | ----------------------------------------------- |
| MMKV         | `npx expo install react-native-mmkv react-native-nitro-modules` | `mmkvDriver(createMMKV())`                      |
| AsyncStorage | `npx expo install @react-native-async-storage/async-storage`    | `asyncStorageDriver(AsyncStorage)`              |
| SecureStore  | `npx expo install expo-secure-store`                            | `secureStoreDriver(SecureStore, options)`       |
| Web Storage  | nada                                                            | `webStorageDriver(window.localStorage, window)` |
| Memory       | nada                                                            | `memoryDriver()`                                |

## Uso

[`test/readme.test.ts`](test/readme.test.ts) compila y ejecuta los ejemplos de abajo, con el driver de memoria en lugar de MMKV.

### Comprobar valores con un esquema

El esquema se ejecuta al escribir y al leer. Escribir un valor no válido se rechaza y no escribe nada; leer un valor guardado que no es válido devuelve el valor por defecto y llama a `onError`.

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

### Mostrar un valor en un componente

`useStorageItem` devuelve el valor, un setter que acepta un valor o una función de actualización, y el estado del elemento. Todos los componentes que muestran el elemento se vuelven a renderizar después de una escritura, venga de donde venga.

```tsx
function ThemePicker() {
  const [value, setValue, { status, error }] = useStorageItem(theme);
  if (status === 'error') return <Text>Could not read the theme: {error?.code}</Text>;
  return <Button title={`Theme: ${value}`} onPress={() => setValue('dark')} />;
}
```

Con un driver asíncrono (AsyncStorage, SecureStore) el primer render tiene el valor por defecto y `status: 'loading'`.

### Hacer que los valores caduquen

```ts
const draft = storage.item('draft', { defaultValue: '', ttl: 5 * 60 * 1000 });
await draft.set('Buy milk'); // gone five minutes later

const otp = storage.item<string>('otp');
await otp.set('482913', { ttl: 30_000 }); // a lifetime for one write
await storage.purgeExpired(); // removes every expired value in the namespace
```

### Cambiar la forma de los datos guardados

Sube `version` y añade una migration por cada paso. Los registros antiguos se actualizan al leerlos y se guardan con la forma nueva.

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

### Guardar un token en el Keychain

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

`getOrCreateSecret(item)` crea una clave aleatoria una sola vez y después la devuelve, por ejemplo para cifrar una instancia de MMKV; consulta [Guardar tokens y claves de forma segura](docs/guides/secure-values.md).

### Persistir un store de Zustand

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

El mismo adaptador funciona con Jotai, Redux Persist y los persisters de TanStack Query.

## Demo

[`Examples/StorageDemo`](Examples/StorageDemo) es una app de Expo SDK 58 (React Native 0.88) que usa todas las funciones anteriores con el MMKV y el SecureStore reales: un contador, un tema comprobado con Zod, un borrador con un TTL de cinco minutos, un perfil migrado desde la versión 1 y un token creado con `expo-crypto` y guardado en el Keychain. Las pantallas de abajo salen de [`scripts/capture-screenshots.sh`](scripts/capture-screenshots.sh), que instala la app en un simulador de iPhone y la captura.

| Claro                                                                           | Oscuro                                                                        |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| ![Storage Demo, parte superior de la pantalla, claro](docs/images/demo-top-light.png)       | ![Storage Demo, parte superior de la pantalla, oscuro](docs/images/demo-top-dark.png)       |
| ![Storage Demo, parte inferior de la pantalla, claro](docs/images/demo-bottom-light.png) | ![Storage Demo, parte inferior de la pantalla, oscuro](docs/images/demo-bottom-dark.png) |

Ejecútalo tú mismo:

```sh
cd Examples/StorageDemo
npm install
npx expo run:ios      # or: npx expo run:android, npx expo start --web
```

## Documentación

Referencia de la API y artículos:

- [Referencia de la API](https://muhittincamdali.github.io/ReactNativeStorage/) — todos los exports, generada con TypeDoc a partir del código fuente (`npm run docs` la genera en local en `docs/api`).
- [Códigos de error](src/errors.ts) — qué significa cada código de `StorageError`.

## Guías

- [Pasar de AsyncStorage a MMKV](docs/guides/migrating-from-async-storage.md) — copia las claves antiguas una vez y léelas a través de `legacy`.
- [Cambiar la forma de los datos guardados](docs/guides/schemas-and-migrations.md) — esquemas, versiones y migrations, y qué valores conserva el codec.
- [Guardar tokens y claves de forma segura](docs/guides/secure-values.md) — SecureStore y una clave de cifrado para MMKV.
- [Probar código que usa almacenamiento](docs/guides/testing.md) — el driver de memoria, un reloj controlado y ajustes de Jest.

## Requisitos

| Herramienta                         | Versión mínima                        |
| ----------------------------------- | ------------------------------------- |
| React                               | 18 (por `useSyncExternalStore`)       |
| TypeScript, si compruebas los tipos | 5.0                                   |
| react-native-mmkv, para `mmkvDriver` | 3 (la versión 4 necesita React Native 0.76) |
| Node.js, para trabajar en este repositorio | 22.12                          |

La app de ejemplo y el script de extremo a extremo se prueban con Expo SDK 58, React Native 0.88, Xcode 27 y el simulador de iOS 27.

## Arquitectura

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

Decisiones que conviene conocer si vas a contribuir:

- Los drivers adaptan una instancia que crea la app y la reconocen por su forma, así que el paquete no tiene dependencias en tiempo de ejecución y admite varias versiones de cada backend.
- Las lecturas nunca lanzan una excepción por datos incorrectos, solo cuando falla el driver; las escrituras se rechazan y no escriben nada.
- El key store muestra una escritura al instante y envía las escrituras a una misma clave en el orden de las llamadas; si falla la escritura más reciente, vuelve al último valor que confirmó el backend.
- Cada límite se comprueba en la frontera: longitud y caracteres de la clave, tamaño del valor en bytes UTF-8, profundidad de anidamiento, versiones de esquema, TTLs (finitos y dentro del rango de enteros seguros) y retardos de temporizador (como máximo 2^31-1 ms).

## Hoja de ruta

Próximos pasos previstos, que se siguen en el [issue tracker](https://github.com/muhittincamdali/ReactNativeStorage/issues):

- publicar el paquete en el registro de npm;
- una ejecución del script de extremo a extremo en un emulador de Android en CI;
- un índice de claves opcional para SecureStore, para que `clear()` pueda eliminar todos los secretos al cerrar sesión.

## Contribuir

Las contribuciones son bienvenidas. Lee la [guía de contribución](https://github.com/muhittincamdali/ReactNativeStorage/blob/main/CONTRIBUTING.md) y el [código de conducta](https://github.com/muhittincamdali/ReactNativeStorage/blob/main/CODE_OF_CONDUCT.md) antes de abrir una pull request. Informa de los problemas de seguridad de forma privada, como se describe en la [política de seguridad](https://github.com/muhittincamdali/ReactNativeStorage/blob/main/SECURITY.md).

## Licencia

Publicado bajo la licencia MIT. Consulta [LICENSE](LICENSE).
