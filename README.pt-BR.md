<!-- i18n-source: README.md@5cce8b18fbbe77cdfe1e2e6a4f1fb2f0ccbcb3bf status=reviewed -->
<!-- brand:start -->

<p align="center"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/banner-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/banner-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/banner-light.svg" alt="React Native Storage: Typed, validated key-value storage for React Native and Expo on MMKV, AsyncStorage or SecureStore."></picture></p>

<!-- lang-selector:start -->
<p align="center"><a href="README.md">English</a> · <a href="README.tr.md">Türkçe</a> · <a href="README.zh-CN.md">简体中文</a> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a> · <a href="README.es.md">Español</a> · <a href="README.de.md">Deutsch</a> · <a href="README.fr.md">Français</a> · <a href="README.pt-BR.md">Português (Brasil)</a> · <a href="README.ru.md">Русский</a></p>
<!-- lang-selector:end -->

<p align="center">
<a href="https://github.com/muhittincamdali/ReactNativeStorage/actions/workflows/ci.yml"><img src="https://github.com/muhittincamdali/ReactNativeStorage/actions/workflows/ci.yml/badge.svg" alt="Status da CI"></a>
<a href="https://github.com/muhittincamdali/ReactNativeStorage/releases"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-version-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-version-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-version-light.svg" alt="Versão mais recente: v2.0.0"></picture></a>
<a href="https://github.com/muhittincamdali/ReactNativeStorage/blob/main/LICENSE"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-license-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-license-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-license-light.svg" alt="Licença: MIT"></picture></a>
<a href="https://github.com/muhittincamdali/ReactNativeStorage/blob/main/package.json"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-framework-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-framework-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-framework-light.svg" alt="Versão da linguagem: React 18+"></picture></a>
</p>

<p align="center">
<a href="#início-rápido"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-start-pt-BR-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-start-pt-BR-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-start-pt-BR-light.svg" alt="Começar"></picture></a>
<a href="https://github.com/muhittincamdali/ReactNativeStorage/blob/main/docs/guides/overview.md"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-docs-pt-BR-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-docs-pt-BR-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-docs-pt-BR-light.svg" alt="Documentação"></picture></a>
<a href="https://github.com/muhittincamdali/ReactNativeStorage/tree/main/Examples"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-examples-pt-BR-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-examples-pt-BR-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-examples-pt-BR-light.svg" alt="Exemplos"></picture></a>
</p>

> Esta é uma tradução do README em inglês. Se houver diferença, vale a versão em inglês.

<!-- brand:end -->

Uma biblioteca TypeScript para guardar os dados do app no dispositivo em apps React Native e Expo. Você declara cada valor uma única vez, com um nome, um valor padrão e, opcionalmente, um schema, um tempo de vida e uma versão; depois lê e grava o valor de qualquer lugar, ou o exibe em um componente com um hook que renderiza de novo quando ele muda. Os bytes são armazenados por um driver que você escolhe: MMKV, AsyncStorage, SecureStore, `localStorage` ou memória. Ela é para apps que superaram as chamadas escritas à mão, como `JSON.parse(await AsyncStorage.getItem(...))`, e querem que os dados armazenados sejam validados, tipados e atualizáveis entre versões do app.

## Destaques

- **Tipado e validado** — qualquer [Standard Schema](https://standardschema.dev) (Zod, Valibot, ArkType) ou um type guard verifica os valores ao gravar e ao ler; o tipo do item vem do schema.
- **Uma API para cinco backends** — MMKV (síncrono, então os hooks já têm o valor na primeira renderização), AsyncStorage, SecureStore (Keychain e Keystore), `localStorage` e memória, atrás dos mesmos `get`, `set`, `remove` e `useStorageItem`.
- **Dados que sobrevivem às atualizações do app** — cada registro carrega uma versão de schema; as migrations atualizam registros antigos passo a passo, um leitor `legacy` adota os valores gravados antes desta biblioteca, e registros de uma versão mais nova do app são deixados intactos.
- **Expiração** — um time to live por item ou por gravação; um componente que exibe um valor expirado volta ao valor padrão no momento em que ele expira.
- **Falhas que não derrubam o app** — dados armazenados corrompidos ou inválidos retornam o valor padrão e chegam ao `onError`; as mensagens de erro citam a chave, nunca o valor.
- **Testado** — 164 testes do Vitest cobrem o codec, a validação, as migrations, o TTL, a ordem de gravações concorrentes, cada driver, o hook e os helpers; o app de exemplo roda em um simulador do iOS 27 com o MMKV e o Keychain reais em [`scripts/e2e-ios.sh`](scripts/e2e-ios.sh).

## Início rápido

**1. Adicione o pacote**

```sh
npm install github:muhittincamdali/ReactNativeStorage react-native-mmkv react-native-nitro-modules
```

O pacote é instalado a partir do GitHub. O MMKV é um módulo nativo: execute o app com `npx expo run:ios` ou `npx expo run:android` (um development build), não no Expo Go.

**2. Importe o módulo**

```tsx
import { createStorage, mmkvDriver } from 'react-native-storage-toolkit';
import { useStorageItem } from 'react-native-storage-toolkit/react';
```

**3. Use**

Este componente, de [`Examples/StorageDemo/src/QuickStart.tsx`](Examples/StorageDemo/src/QuickStart.tsx), conta os toques e continua mostrando a contagem depois que o app é reiniciado:

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

## Instalação

O pacote não está no registro do npm. Instale-o a partir do GitHub com npm, pnpm ou Yarn:

```sh
npm install github:muhittincamdali/ReactNativeStorage
```

Ele é distribuído com o código-fonte em TypeScript, que o Metro, o Expo, o Vitest e o preset `jest-expo` compilam diretamente; nada é executado durante a instalação. Depois, adicione o backend que você quer usar:

| Backend      | Instalação                                                      | Driver                                          |
| ------------ | --------------------------------------------------------------- | ----------------------------------------------- |
| MMKV         | `npx expo install react-native-mmkv react-native-nitro-modules` | `mmkvDriver(createMMKV())`                      |
| AsyncStorage | `npx expo install @react-native-async-storage/async-storage`    | `asyncStorageDriver(AsyncStorage)`              |
| SecureStore  | `npx expo install expo-secure-store`                            | `secureStoreDriver(SecureStore, options)`       |
| Web Storage  | nada                                                            | `webStorageDriver(window.localStorage, window)` |
| Memory       | nada                                                            | `memoryDriver()`                                |

## Uso

Os exemplos abaixo são compilados e executados por [`test/readme.test.tsx`](test/readme.test.tsx), com o driver de memória no lugar do MMKV.

### Verificar valores com um schema

O schema roda quando você grava e quando você lê. Gravar um valor inválido é rejeitado e não grava nada; ler um valor armazenado inválido retorna o valor padrão e chama `onError`.

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

### Exibir um valor em um componente

`useStorageItem` retorna o valor, um setter que aceita um valor ou uma função de atualização, e o estado do item. Todo componente que exibe o item renderiza de novo depois de uma gravação, de onde quer que ela tenha vindo.

```tsx
function ThemePicker() {
  const [value, setValue, { status, error }] = useStorageItem(theme);
  if (status === 'error') return <Text>Could not read the theme: {error?.code}</Text>;
  return <Button title={`Theme: ${value}`} onPress={() => setValue('dark')} />;
}
```

Com um driver assíncrono (AsyncStorage, SecureStore), a primeira renderização tem o valor padrão e `status: 'loading'`.

### Fazer valores expirarem

```ts
const draft = storage.item('draft', { defaultValue: '', ttl: 5 * 60 * 1000 });
await draft.set('Buy milk'); // gone five minutes later

const otp = storage.item<string>('otp');
await otp.set('482913', { ttl: 30_000 }); // a lifetime for one write
await storage.purgeExpired(); // removes every expired value in the namespace
```

### Mudar o formato dos dados armazenados

Aumente `version` e adicione uma migration por etapa. Os registros antigos são atualizados na leitura e salvos no novo formato.

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

### Guardar um token no Keychain

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

`getOrCreateSecret(item)` cria uma chave aleatória uma única vez e a retorna depois, por exemplo para criptografar uma instância do MMKV; veja [Mantenha tokens e chaves seguros](docs/guides/secure-values.md). Ela nunca sobrescreve um valor salvo que não consegue usar: dados corrompidos, inválidos ou expirados são rejeitados com um `StorageError` e permanecem como estão.

### Persistir um store do Zustand

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

O mesmo adaptador funciona com Jotai, Redux Persist e os persisters do TanStack Query.

## Demonstração

[`Examples/StorageDemo`](Examples/StorageDemo) é um app Expo SDK 58 (React Native 0.88) que usa todos os recursos acima com o MMKV e o SecureStore reais: um contador, um tema verificado pelo Zod, um rascunho com TTL de cinco minutos, um perfil migrado da versão 1 e um token criado com `expo-crypto` e guardado no Keychain. As telas abaixo vêm de [`scripts/capture-screenshots.sh`](scripts/capture-screenshots.sh), que instala o app em um simulador de iPhone e faz as capturas.

| Claro                                                                           | Escuro                                                                        |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| ![Storage Demo, parte superior da tela, claro](docs/images/demo-top-light.png)       | ![Storage Demo, parte superior da tela, escuro](docs/images/demo-top-dark.png)       |
| ![Storage Demo, parte inferior da tela, claro](docs/images/demo-bottom-light.png) | ![Storage Demo, parte inferior da tela, escuro](docs/images/demo-bottom-dark.png) |

Execute você mesmo:

```sh
cd Examples/StorageDemo
npm install
npx expo run:ios      # or: npx expo run:android, npx expo start --web
```

## Documentação

Referência da API e artigos:

- Referência da API — todos os exports, gerada com o TypeDoc a partir do código-fonte (`npm run docs` gera localmente em `docs/api`); o [workflow Docs](.github/workflows/docs.yml) a publica no GitHub Pages a partir da `main`.
- [Códigos de erro](src/errors.ts) — o que cada código de `StorageError` significa.

## Guias

- [Migre do AsyncStorage para o MMKV](docs/guides/migrating-from-async-storage.md) — copie as chaves antigas uma vez e leia-as por meio de `legacy`.
- [Mude o formato dos dados armazenados](docs/guides/schemas-and-migrations.md) — schemas, versões e migrations, e quais valores o codec preserva.
- [Mantenha tokens e chaves seguros](docs/guides/secure-values.md) — SecureStore e uma chave de criptografia para o MMKV.
- [Teste código que usa armazenamento](docs/guides/testing.md) — o driver de memória, um relógio controlado e configurações do Jest.

## Requisitos

| Toolchain                           | Versão mínima                         |
| ----------------------------------- | ------------------------------------- |
| React                               | 18 (por causa do `useSyncExternalStore`) |
| TypeScript, se você verifica tipos  | 5.0                                   |
| react-native-mmkv, para `mmkvDriver` | 3 (a versão 4 exige React Native 0.76) |
| Node.js, para trabalhar neste repositório | 22.12                           |

O app de exemplo e o script de ponta a ponta são testados com Expo SDK 58, React Native 0.88, Xcode 27 e o simulador do iOS 27.

## Arquitetura

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

Decisões que quem contribui deve conhecer:

- Os drivers adaptam uma instância criada pelo app e a reconhecem pelo formato; por isso o pacote não tem dependências de runtime e oferece suporte a várias versões de cada backend.
- As leituras nunca lançam erro por causa de dados inválidos, só por causa de um driver que falha; as gravações são rejeitadas e não gravam nada.
- O key store mostra uma gravação imediatamente e envia as gravações de uma mesma chave na ordem das chamadas; quando a gravação mais recente falha, ele volta ao último valor que o backend confirmou.
- Todo limite é verificado na fronteira: tamanho e caracteres da chave, tamanho do valor em bytes UTF-8, profundidade de aninhamento, versões de schema, TTLs (finitos e dentro do intervalo de inteiros seguros) e atrasos de timer (no máximo 2^31-1 ms).

## Roteiro

Planejado para as próximas etapas, acompanhado no [issue tracker](https://github.com/muhittincamdali/ReactNativeStorage/issues):

- publicar o pacote no registro do npm;
- uma execução do script de ponta a ponta em um emulador Android no CI;
- um índice de chaves opcional para o SecureStore, para que `clear()` possa remover todos os segredos ao sair da conta.

## Como contribuir

Contribuições são bem-vindas. Leia o [guia de contribuição](https://github.com/muhittincamdali/ReactNativeStorage/blob/main/CONTRIBUTING.md) e o [código de conduta](https://github.com/muhittincamdali/ReactNativeStorage/blob/main/CODE_OF_CONDUCT.md) antes de abrir um pull request. Relate problemas de segurança de forma privada, como descrito na [política de segurança](https://github.com/muhittincamdali/ReactNativeStorage/blob/main/SECURITY.md).

## Licença

Publicado sob a licença MIT. Veja [LICENSE](LICENSE).
