#!/bin/sh
set -e
cd "$(dirname "$0")/.."
npm run start:dev --prefix backend &
npm run dev --prefix web &
npm run dev --prefix admin &
wait
