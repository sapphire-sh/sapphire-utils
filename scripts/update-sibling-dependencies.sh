#!/bin/zsh

DRY_RUN=false
[[ "$1" == "--dry-run" ]] && DRY_RUN=true

PARENT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
PACKAGE="@sapphire-sh/utils"
LATEST="$(npm view "$PACKAGE" version 2>/dev/null)"

LOCAL="$(sed -n 's/.*"version": *"\(.*\)".*/\1/p' "$PARENT_DIR/sapphire-utils/package.json" | head -1)"

if [[ -z "$LATEST" ]]; then
  echo "failed to fetch latest version of $PACKAGE"
  exit 1
fi

if [[ "$LOCAL" != "$LATEST" ]]; then
  echo "version mismatch: local $LOCAL ≠ npm $LATEST (publish first)"
  exit 1
fi

echo "latest $PACKAGE: $LATEST"
$DRY_RUN && echo "(dry run)"
echo ""

find "$PARENT_DIR" -maxdepth 3 -name package.json -not -path '*/node_modules/*' -not -path '*/sapphire-utils/*' | while read -r pkg; do
  dir="$(dirname "$pkg")"
  label="${dir#$PARENT_DIR/}"

  if grep -q "\"$PACKAGE\"" "$pkg" 2>/dev/null; then
    current="$(grep -o "\"$PACKAGE\": *\"[^\"]*\"" "$pkg" | head -1 | sed 's/.*"[^0-9]*\([0-9][^"]*\)".*/\1/')"

    if [[ "$current" == "$LATEST" ]]; then
      echo "$label: already $LATEST ✓"
    else
      echo "$label: $current → $LATEST"
      if ! $DRY_RUN; then
        sed -i '' "s|\"$PACKAGE\": *\"[^\"]*\"|\"$PACKAGE\": \"^$LATEST\"|" "$pkg"
        (cd "$dir" && npm install --no-audit --no-fund 2>&1 | tail -1) || echo "$label: npm install failed (manual fix needed)"
        grep -q '"bootstrap"' "$pkg" && (cd "$dir" && npm run bootstrap 2>&1 | tail -1)
      fi
    fi
  fi
done
