#!/usr/bin/env bash
# Graba la sesión de prueba del diario con el CLI agent-browser (screencast de
# Chromium) y deja demo.webm. Reproducible: bash record-demo.sh
#
# ffmpeg tiene que estar en el PATH del daemon de agent-browser; si el daemon
# se arrancó sin él, `record stop` falla con "ffmpeg not found". Para
# reiniciarlo: mata el proceso agent-browser-linux-x64 y vuelve a lanzar esto.
set -uo pipefail

ART="$(cd "$(dirname "$0")" && pwd)"
export PATH="/home/hermes/.hermes/tools/ffmpeg-9.0.1-linux-x64/bin:$PATH"
export AGENT_BROWSER_EXECUTABLE_PATH=/home/hermes/.hermes/profiles/devops_expert/cache/scratch/chrome-wrapper.sh
export AGENT_BROWSER_ARGS="--no-sandbox"
AB=/home/hermes/.hermes/profiles/devops_expert/cache/scratch/node_modules/.bin/agent-browser
URL="file://$(cd "$ART/../.." && pwd)/diario.html"

$AB set viewport 1120 900 >/dev/null
$AB record start "$ART/demo.webm" "$URL" >/dev/null
$AB eval "localStorage.clear()" >/dev/null
$AB reload >/dev/null
$AB wait 1500 >/dev/null

# 1. Primera entrada
$AB click "[data-input]" >/dev/null
$AB keyboard type "Hoy caminé por el parque y leí un rato bajo el sol."
$AB wait 1000 >/dev/null
$AB select "[data-mood]" good >/dev/null
$AB wait 700 >/dev/null
$AB click "button.primary" >/dev/null
$AB wait 1800 >/dev/null

# 2. Segunda entrada
$AB click "[data-input]" >/dev/null
$AB keyboard type "Terminé el informe y cené con Marta."
$AB wait 1000 >/dev/null
$AB click "button.primary" >/dev/null
$AB wait 1800 >/dev/null

# 3. Buscar
$AB click "[data-search]" >/dev/null
$AB keyboard type "informe"
$AB wait 2200 >/dev/null
$AB click "[data-search]" >/dev/null
$AB press "Control+a" >/dev/null
$AB press "Backspace" >/dev/null
$AB wait 1200 >/dev/null

# 4. Recargar: sigue guardado
$AB reload >/dev/null
$AB wait 1800 >/dev/null

# 5. Borrar una
$AB click ".entry:last-of-type [data-action='delete']" >/dev/null
$AB wait 1500 >/dev/null

$AB record stop
