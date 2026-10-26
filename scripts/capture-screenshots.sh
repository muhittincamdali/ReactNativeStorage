#!/usr/bin/env bash
# Captures the README screenshots of the StorageDemo example on an iPhone simulator: the top and
# the bottom of the screen, in light and dark appearance, with a fixed status bar.
#
# The app starts from a fresh install and runs a few actions given as a launch argument (the
# same code its buttons run), so every value on the screens was written to and read back from
# MMKV and the Keychain.
#
# Usage: scripts/capture-screenshots.sh <simulator UDID> [path to StorageDemo.app]
# Output: docs/images/demo-{top,bottom}-{light,dark}.png
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
udid="${1:?Pass the UDID of an iOS simulator (xcrun simctl list devices)}"
app="${2:-$("$repo_root/scripts/build-example-ios.sh" "$udid")}"
bundle_id="io.github.muhittincamdali.storagedemo"
out="$repo_root/docs/images"
mkdir -p "$out"

xcrun simctl boot "$udid" 2>/dev/null || true
xcrun simctl bootstatus "$udid" -b >/dev/null
xcrun simctl status_bar "$udid" override --time 9:41 --batteryState charged --batteryLevel 100 \
  --cellularMode active --cellularBars 4 --wifiBars 3
xcrun simctl uninstall "$udid" "$bundle_id" 2>/dev/null || true
xcrun simctl install "$udid" "$app"

first_launch=1
for appearance in light dark; do
  xcrun simctl ui "$udid" appearance "$appearance"
  for part in top bottom; do
    xcrun simctl terminate "$udid" "$bundle_id" 2>/dev/null || true
    arguments=()
    if [[ "$first_launch" == 1 ]]; then
      arguments+=(-demoActions "press,press,press,draft=Pick up the dry cleaning,create-token")
      first_launch=0
    fi
    [[ "$part" == bottom ]] && arguments+=(-demoScroll end)
    xcrun simctl launch "$udid" "$bundle_id" ${arguments[@]+"${arguments[@]}"} >/dev/null
    sleep 5
    xcrun simctl io "$udid" screenshot "$out/demo-$part-$appearance.png" >/dev/null
    echo "docs/images/demo-$part-$appearance.png"
  done
done
xcrun simctl status_bar "$udid" clear
