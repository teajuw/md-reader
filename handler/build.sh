#!/bin/sh
# Compiles the Finder handler on this Mac and registers it for Markdown files.
set -eu

here=$(cd "$(dirname "$0")" && pwd)
apps="$HOME/Applications"
app="$apps/md-reader.app"
plist="$app/Contents/Info.plist"
buddy=/usr/libexec/PlistBuddy

mkdir -p "$apps"
rm -rf "$app"
osacompile -o "$app" "$here/handler.applescript"

"$buddy" -c "Add :CFBundleIdentifier string dev.trevorju.md-reader" "$plist" 2>/dev/null ||
	"$buddy" -c "Set :CFBundleIdentifier dev.trevorju.md-reader" "$plist"
"$buddy" -c "Add :LSUIElement bool true" "$plist"
"$buddy" -c "Delete :CFBundleDocumentTypes" "$plist" 2>/dev/null || true
"$buddy" -c "Add :CFBundleDocumentTypes array" "$plist"
"$buddy" -c "Add :CFBundleDocumentTypes:0 dict" "$plist"
"$buddy" -c "Add :CFBundleDocumentTypes:0:CFBundleTypeName string Markdown" "$plist"
"$buddy" -c "Add :CFBundleDocumentTypes:0:CFBundleTypeRole string Viewer" "$plist"
"$buddy" -c "Add :CFBundleDocumentTypes:0:LSHandlerRank string Default" "$plist"
"$buddy" -c "Add :CFBundleDocumentTypes:0:LSItemContentTypes array" "$plist"
"$buddy" -c "Add :CFBundleDocumentTypes:0:LSItemContentTypes:0 string net.daringfireball.markdown" "$plist"
"$buddy" -c "Add :CFBundleDocumentTypes:0:CFBundleTypeExtensions array" "$plist"
"$buddy" -c "Add :CFBundleDocumentTypes:0:CFBundleTypeExtensions:0 string md" "$plist"
"$buddy" -c "Add :CFBundleDocumentTypes:0:CFBundleTypeExtensions:1 string markdown" "$plist"

cp "$here/icon.icns" "$app/Contents/Resources/droplet.icns"
rm -f "$app/Contents/Resources/Assets.car"
"$buddy" -c "Delete :CFBundleIconName" "$plist" 2>/dev/null || true

codesign --force --deep --sign - "$app"
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -f "$app"

printf '%s\n' "$app"
