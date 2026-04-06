#!/bin/zsh

DRY_RUN=false
[[ "$1" == "--dry-run" ]] && DRY_RUN=true

PARENT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
PACKAGE="@sapphire-sh/utils"
LATEST="$(npm view "$PACKAGE" version 2>/dev/null)"

if [[ -z "$LATEST" ]]; then
  echo "failed to fetch latest version of $PACKAGE"
  exit 1
fi

echo "latest $PACKAGE: $LATEST"
$DRY_RUN && echo "(dry run)"
echo ""

find "$PARENT_DIR" -name package.json -not -path '*/node_modules/*' -not -path '*/sapphire-utils/*' | while read -r pkg; do
  dir="$(dirname "$pkg")"
  label="${dir#$PARENT_DIR/}"

  if grep -q "\"$PACKAGE\"" "$pkg" 2>/dev/null; then
    current="$(cd "$dir" && node -e "const p = require('./package.json'); console.log((p.dependencies?.['$PACKAGE'] ?? p.devDependencies?.['$PACKAGE'] ?? '').replace(/^[^0-9]*/, ''))")"

    if [[ "$current" == "$LATEST" ]]; then
      echo "$label: already $LATEST ✓"
    else
      echo "$label: $current → $LATEST"
      $DRY_RUN || (cd "$dir" && npm install "$PACKAGE@$LATEST" 2>&1 | tail -1)
    fi
  fi
done
