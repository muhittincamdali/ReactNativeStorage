# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Expo modules support
- Cloud sync integration

## [1.2.0] - 2026-02-06

### Added
- **MMKV Storage**
  - Ultra-fast key-value storage
  - Multi-process support
  - Encryption support
  - React hooks integration

- **SQLite Storage**
  - Type-safe ORM
  - Migration support
  - Transaction support
  - Query builder

- **Secure Storage**
  - Keychain/Keystore integration
  - Biometric protection
  - Encryption at rest
  - Secure sharing

- **File Storage**
  - Document storage
  - Image caching
  - Large file handling
  - Background downloads

### Changed
- Improved TypeScript types
- Better error messages
- Enhanced React Native 0.73 support

### Fixed
- Memory leak in file cache
- Race condition in MMKV

## [1.1.0] - 2026-01-15

### Added
- AsyncStorage migration tool
- React Query integration
- Zustand middleware

## [1.0.0] - 2026-01-01

### Added
- Initial release with MMKV and SQLite support
- Full documentation and examples

[Unreleased]: https://github.com/muhittincamdali/ReactNativeStorage/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/muhittincamdali/ReactNativeStorage/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/muhittincamdali/ReactNativeStorage/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/muhittincamdali/ReactNativeStorage/releases/tag/v1.0.0
