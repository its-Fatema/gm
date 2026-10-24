#!/bin/bash
# usage: tools/run.sh script.js [args]   (starts a throwaway static server)
cd "$(dirname "$0")/.."
python3 -m http.server 8123 >/dev/null 2>&1 & SP=$!
sleep .8; node "$@"; RC=$?; kill $SP 2>/dev/null; exit $RC
