# Contributing

Thanks for taking the time to improve React Native Storage.

## Reporting bugs

Open an issue with:

- the driver (MMKV, AsyncStorage, SecureStore, Web Storage, memory) and its package version,
- the item options and the smallest code that shows the problem,
- what you expected and what happened, with the `StorageError` code if there is one,
- React Native or Expo SDK version and the platform.

Do not paste stored values that may be secret.

## Development

You need Node.js 22.12 or later.

```sh
npm ci
npm run lint        # ESLint and Prettier
npm run typecheck   # the library, the tests and the type tests; src/ also without DOM types
npm test            # Vitest
npm run docs        # TypeDoc into docs/api
```

The example app needs Xcode for iOS:

```sh
cd Examples/StorageDemo
npm ci
npm run typecheck
npm run bundle                                   # Metro bundles for iOS, Android and the web
cd ../..
scripts/e2e-ios.sh <simulator UDID>              # builds, installs and checks the app
scripts/capture-screenshots.sh <simulator UDID>  # regenerates docs/images
```

## Pull requests

1. Fork the repository and branch from `main`.
2. Keep each pull request focused on one change.
3. Add or update tests in `test/` for any change in behaviour. Test edge cases at the
   boundaries: empty and oversized input, `NaN` and infinities, concurrent calls.
4. If you change a README code sample, change the copy in `test/readme.test.ts`, which compiles
   and runs the samples.
5. If you change the example app's screens, regenerate the screenshots.
6. `README.md` has translations (`README.<language>.md`). If you change `README.md` and cannot
   update them, say so in the pull request.

## Code style

- TypeScript in strict mode; `src/` must not use DOM or Node APIs, because it runs in React
  Native.
- No runtime dependencies: drivers accept the backend's instance and match it by shape.
- Errors are `StorageError` with a code; messages never contain stored values.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/)
  (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `ci:`, `chore:`).

## License

By contributing you agree that your contributions are licensed under the MIT License.
