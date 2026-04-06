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

for dir in "$PARENT_DIR"/*/; do
  [[ -f "$dir/package.json" ]] || continue
  [[ "$(basename "$dir")" == "sapphire-utils" ]] && continue

  if grep -q "\"$PACKAGE\"" "$dir/package.json" 2>/dev/null; then
    current="$(cd "$dir" && node -e "const p = require('./package.json'); console.log((p.dependencies?.['$PACKAGE'] ?? p.devDependencies?.['$PACKAGE'] ?? '').replace(/^[^0-9]*/, ''))")"

    if [[ "$current" == "$LATEST" ]]; then
      echo "$(basename "$dir"): already $LATEST ✓"
    else
      echo "$(basename "$dir"): $current → $LATEST"
      $DRY_RUN || (cd "$dir" && npm install "$PACKAGE@$LATEST" --save-exact 2>&1 | tail -1)
    fi
  fi
done
