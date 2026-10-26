#!/usr/bin/env bash
# Builds the StorageDemo example (Examples/StorageDemo) as a Release app for an iOS simulator.
# The JavaScript bundle is embedded, so the app runs without the Metro dev server. The app is
# signed to run locally (identity "-"): without a signature it has no Keychain entitlement and
# SecureStore fails.
#
# Usage: scripts/build-example-ios.sh <simulator UDID>
# Output: the path of StorageDemo.app on stdout (the build log goes to stderr).
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
example="$repo_root/Examples/StorageDemo"
udid="${1:?Pass the UDID of an iOS simulator (xcrun simctl list devices)}"

cd "$example"
npm ci --no-audit --no-fund >&2
CI=1 npx expo prebuild --platform ios --clean --no-install >&2
(cd ios && pod install >&2)
xcodebuild build \
  -workspace ios/StorageDemo.xcworkspace \
  -scheme StorageDemo \
  -configuration Release \
  -sdk iphonesimulator \
  -destination "id=$udid" \
  -derivedDataPath ios/build \
  CODE_SIGN_IDENTITY=- \
  -quiet >&2
echo "$example/ios/build/Build/Products/Release-iphonesimulator/StorageDemo.app"
