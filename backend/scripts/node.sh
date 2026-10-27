#!/bin/sh
set -e
preferred="$HOME/.nvm/versions/node/v22.23.4/bin/node"
if [ -x "$preferred" ]; then
  exec "$preferred" "$@"
fi
exec node "$@"
