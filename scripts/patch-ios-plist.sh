#!/usr/bin/env bash
set -euo pipefail

PLIST="ios/App/App/Info.plist"
PB="/usr/libexec/PlistBuddy"

if [ ! -f "$PLIST" ]; then
  echo "ERROR: $PLIST not found. Run 'npx cap add ios && npx cap sync ios' first." >&2
  exit 1
fi

set_bool() {
  local key="$1" val="$2"
  "$PB" -c "Add :$key bool $val" "$PLIST" 2>/dev/null || \
  "$PB" -c "Set :$key $val" "$PLIST"
}

set_bool UIFileSharingEnabled true
set_bool LSSupportsOpeningDocumentsInPlace true

"$PB" -c "Delete :CFBundleDocumentTypes" "$PLIST" 2>/dev/null || true
"$PB" -c "Add :CFBundleDocumentTypes array" "$PLIST"

add_doc_type() {
  local idx="$1" name="$2" rank="$3"
  shift 3
  "$PB" -c "Add :CFBundleDocumentTypes:$idx dict" "$PLIST"
  "$PB" -c "Add :CFBundleDocumentTypes:$idx:CFBundleTypeName string $name" "$PLIST"
  "$PB" -c "Add :CFBundleDocumentTypes:$idx:CFBundleTypeRole string Viewer" "$PLIST"
  "$PB" -c "Add :CFBundleDocumentTypes:$idx:LSHandlerRank string $rank" "$PLIST"
  "$PB" -c "Add :CFBundleDocumentTypes:$idx:LSItemContentTypes array" "$PLIST"
  local i=0
  for uti in "$@"; do
    "$PB" -c "Add :CFBundleDocumentTypes:$idx:LSItemContentTypes:$i string $uti" "$PLIST"
    i=$((i + 1))
  done
}

add_doc_type 0 "Archive" "Owner" \
  "public.zip-archive" \
  "public.archive" \
  "com.rarlab.rar-archive" \
  "org.7-zip.7-zip-archive" \
  "public.tar-archive" \
  "org.gnu.gnu-zip-archive" \
  "com.private.picmanage.cbz" \
  "com.private.picmanage.cbr"

add_doc_type 1 "Image" "Alternate" \
  "public.image" \
  "public.jpeg" \
  "public.png" \
  "com.compuserve.gif" \
  "org.webmproject.webp" \
  "public.heic" \
  "public.heif" \
  "public.tiff" \
  "com.microsoft.bmp" \
  "public.svg-image"

add_doc_type 2 "PDF" "Alternate" "com.adobe.pdf"

add_doc_type 3 "Word Document" "Alternate" \
  "com.microsoft.word.doc" \
  "org.openxmlformats.wordprocessingml.document" \
  "public.rtf"

add_doc_type 4 "Excel Spreadsheet" "Alternate" \
  "com.microsoft.excel.xls" \
  "org.openxmlformats.spreadsheetml.sheet" \
  "public.comma-separated-values-text"

add_doc_type 5 "PowerPoint Presentation" "Alternate" \
  "com.microsoft.powerpoint.ppt" \
  "org.openxmlformats.presentationml.presentation"

add_doc_type 6 "Text" "Alternate" \
  "public.plain-text" \
  "public.text" \
  "net.daringfireball.markdown" \
  "public.json" \
  "public.xml" \
  "public.html"

add_doc_type 7 "Any File" "Alternate" \
  "public.data" \
  "public.content" \
  "public.item"

"$PB" -c "Delete :UTImportedTypeDeclarations" "$PLIST" 2>/dev/null || true
"$PB" -c "Add :UTImportedTypeDeclarations array" "$PLIST"

add_imported_uti() {
  local idx="$1" identifier="$2" desc="$3" ext="$4" mime="$5"
  shift 5
  "$PB" -c "Add :UTImportedTypeDeclarations:$idx dict" "$PLIST"
  "$PB" -c "Add :UTImportedTypeDeclarations:$idx:UTTypeIdentifier string $identifier" "$PLIST"
  "$PB" -c "Add :UTImportedTypeDeclarations:$idx:UTTypeDescription string $desc" "$PLIST"
  "$PB" -c "Add :UTImportedTypeDeclarations:$idx:UTTypeConformsTo array" "$PLIST"
  local i=0
  for parent in "$@"; do
    "$PB" -c "Add :UTImportedTypeDeclarations:$idx:UTTypeConformsTo:$i string $parent" "$PLIST"
    i=$((i + 1))
  done
  "$PB" -c "Add :UTImportedTypeDeclarations:$idx:UTTypeTagSpecification dict" "$PLIST"
  "$PB" -c "Add :UTImportedTypeDeclarations:$idx:UTTypeTagSpecification:public.filename-extension array" "$PLIST"
  "$PB" -c "Add :UTImportedTypeDeclarations:$idx:UTTypeTagSpecification:public.filename-extension:0 string $ext" "$PLIST"
  if [ -n "$mime" ]; then
    "$PB" -c "Add :UTImportedTypeDeclarations:$idx:UTTypeTagSpecification:public.mime-type array" "$PLIST"
    "$PB" -c "Add :UTImportedTypeDeclarations:$idx:UTTypeTagSpecification:public.mime-type:0 string $mime" "$PLIST"
  fi
}

add_imported_uti 0 "com.private.picmanage.cbz" "Comic Book Archive (ZIP)" "cbz" "application/vnd.comicbook+zip" "public.zip-archive" "public.archive"
add_imported_uti 1 "com.private.picmanage.cbr" "Comic Book Archive (RAR)" "cbr" "application/vnd.comicbook-rar" "com.rarlab.rar-archive" "public.archive"

echo "===== Patched Info.plist ====="
"$PB" -c "Print" "$PLIST"
