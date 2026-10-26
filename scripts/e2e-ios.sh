#!/usr/bin/env bash
# Runs the StorageDemo example on an iOS simulator against the real MMKV and Keychain, restarts
# it, and checks that the values survived. Screens are saved for review.
#
#   1. Fresh install, first launch: the version 1 profile is migrated to version 2.
#   2. The app runs actions given as a launch argument (the same code the buttons run): three
#      presses, a draft, a SecureStore token and an invalid theme that must be refused.
#   3. The app is terminated and launched again: every value must still be there and the
#      launch counter must read 2.
#
# The checks read the screen through the accessibility tree with idb (fb-idb), when installed.
#
# Usage: scripts/e2e-ios.sh <simulator UDID> [path to StorageDemo.app]
# Output: _work/e2e/*.png
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
udid="${1:?Pass the UDID of an iOS simulator (xcrun simctl list devices)}"
app="${2:-$("$repo_root/scripts/build-example-ios.sh" "$udid")}"
bundle_id="io.github.muhittincamdali.storagedemo"
out="$repo_root/_work/e2e"
mkdir -p "$out"

xcrun simctl boot "$udid" 2>/dev/null || true
xcrun simctl bootstatus "$udid" -b >/dev/null
xcrun simctl ui "$udid" appearance light
xcrun simctl uninstall "$udid" "$bundle_id" 2>/dev/null || true
xcrun simctl install "$udid" "$app"

screen_text() {
  command -v idb >/dev/null || { echo ""; return; }
  idb ui describe-all --udid "$udid" --json |
    python3 -I -c 'import json, sys
def walk(node):
    yield node
    for child in node.get("children") or []:
        yield from walk(child)
roots = json.load(sys.stdin)
roots = roots if isinstance(roots, list) else [roots]
print(" | ".join(n.get("AXLabel") or "" for root in roots for n in walk(root)))'
}

expect() {
  local text="$1" needle="$2"
  [[ -z "$text" ]] && { echo "skip (no idb): $needle"; return; }
  if [[ "$text" == *"$needle"* ]]; then echo "ok: $needle"; else echo "FAIL: $needle" >&2; exit 1; fi
}

echo "== first launch"
xcrun simctl launch "$udid" "$bundle_id" \
  -demoActions "press,press,press,draft=Buy milk,create-token,invalid-theme" >/dev/null
sleep 6
xcrun simctl io "$udid" screenshot "$out/1-first-launch.png" >/dev/null
first="$(screen_text)"
expect "$first" "Pressed 3 times"
expect "$first" "VALIDATION_FAILED"
expect "$first" "App launches | 1"
expect "$first" "Grace | Last name | Brewster Hopper | Stored schema version | 2"

echo "== relaunch"
xcrun simctl terminate "$udid" "$bundle_id"
xcrun simctl launch "$udid" "$bundle_id" >/dev/null
sleep 6
xcrun simctl io "$udid" screenshot "$out/2-relaunch.png" >/dev/null
second="$(screen_text)"
expect "$second" "Pressed 3 times"
expect "$second" "App launches | 2"
expect "$second" "Last error | none"
expect "$second" "Stored schema version | 2"
if [[ -n "$second" && "$second" == *"Expires in | not saved"* ]]; then
  echo "FAIL: the draft did not survive the restart" >&2
  exit 1
fi
if [[ -n "$second" && "$second" == *"Token | none"* ]]; then
  echo "FAIL: the SecureStore token did not survive the restart" >&2
  exit 1
fi
echo "Screens: $out"
