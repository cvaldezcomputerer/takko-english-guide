#!/usr/bin/env bash
# Compress images under public/images/ before committing.
# Resizes to max 2000px on the longest side and recompresses JPEGs.
# Safe to run multiple times — already-small files are skipped.
#
# Usage:
#   ./scripts/optimize-images.sh              # processes public/images/
#   ./scripts/optimize-images.sh public/images/shrines/奉納

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

TARGET_DIR="${1:-$ROOT_DIR/public/images}"
MAX_PX=2000       # resize if longer edge exceeds this
QUALITY=4         # ffmpeg -q:v: 1 = best, 31 = worst; 4 ≈ 82% JPEG quality
SKIP_UNDER_KB=800 # skip files already under this size (already optimized)

if ! command -v ffmpeg &>/dev/null; then
    echo "Error: ffmpeg not found. Install with: brew install ffmpeg"
    exit 1
fi

if [[ ! -d "$TARGET_DIR" ]]; then
    echo "Error: directory not found: $TARGET_DIR"
    exit 1
fi

total_saved=0
count=0
skipped=0

echo "Target:  $TARGET_DIR"
echo "Max px:  ${MAX_PX}  |  Quality: -q:v ${QUALITY}  |  Skip under: ${SKIP_UNDER_KB}KB"
echo ""

while IFS= read -r file; do
    size_bytes=$(stat -f%z "$file")
    size_kb=$(( size_bytes / 1024 ))

    if (( size_kb < SKIP_UNDER_KB )); then
        printf "  skip  %-45s %dKB\n" "$(basename "$file")" "$size_kb"
        (( skipped++ )) || true
        continue
    fi

    ext="${file##*.}"
    tmp="${file%.*}_opt.${ext}"

    if ffmpeg -y -loglevel error -i "$file" \
        -vf "scale=${MAX_PX}:${MAX_PX}:force_original_aspect_ratio=decrease" \
        -q:v "$QUALITY" \
        "$tmp"; then

        size_after_kb=$(( $(stat -f%z "$tmp") / 1024 ))
        saved=$(( size_kb - size_after_kb ))

        mv "$tmp" "$file"
        total_saved=$(( total_saved + saved ))
        (( count++ )) || true
        printf "  ✓  %-45s %dKB → %dKB  (-%dKB)\n" "$(basename "$file")" "$size_kb" "$size_after_kb" "$saved"
    else
        rm -f "$tmp"
        printf "  !  %-45s ffmpeg failed, skipped\n" "$(basename "$file")"
    fi

done < <(find "$TARGET_DIR" -type f \( -iname "*.jpg" -o -iname "*.jpeg" \) | sort)

echo ""
echo "Done.  Processed: $count  |  Skipped: $skipped  |  Total saved: ~${total_saved}KB (~$(( total_saved / 1024 ))MB)"
