#!/usr/bin/env bash
set -euo pipefail
PORT="${1:-4173}"
echo "Serving EFI static site on port ${PORT}"
python3 -m http.server "${PORT}"
