#!/bin/sh
# Compiles the Finder handler on this Mac and registers it for Markdown files.
set -eu

here=$(cd "$(dirname "$0")" && pwd)
apps="$HOME/Applications"
app="$apps/md-reader.app"
plist="$app/Contents/Info.plist"

mkdir -p "$apps"
rm -rf "$app"
osacompile -o "$app" "$here/handler.applescript"

plutil -replace CFBundleIdentifier -string dev.trevorju.md-reader "$plist"
plutil -replace LSUIElement -bool true "$plist"
plutil -replace CFBundleDocumentTypes -json '[{
	"CFBundleTypeName": "Markdown",
	"CFBundleTypeRole": "Viewer",
	"LSHandlerRank": "Default",
	"LSItemContentTypes": ["net.daringfireball.markdown"],
	"CFBundleTypeExtensions": ["md", "markdown"]
}]' "$plist"

# The icon ships as per-size PNGs and becomes an icns here.
iconutil -c icns "$here/icon.iconset" -o "$app/Contents/Resources/droplet.icns"
rm -f "$app/Contents/Resources/Assets.car"
plutil -remove CFBundleIconName "$plist"

codesign --force --sign - "$app"
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -f "$app"
