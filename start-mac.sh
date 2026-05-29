#!/usr/bin/env bash
#
# AI Product Ops — одношаговый запуск на macOS.
#
# Что делает скрипт:
#   1. Проверяет Node.js (>=18). Если нет — ставит через Homebrew
#      (а если нет и Homebrew — ставит и его).
#   2. Создаёт .env.local из .env.example, если его ещё нет.
#   3. Устанавливает зависимости (npm install).
#   4. Запускает dev-сервер и открывает http://localhost:3000 в браузере.
#
# Запуск:   ./start-mac.sh
# Остановка сервера:  Ctrl+C
#
set -euo pipefail

cd "$(dirname "$0")"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
say()  { echo -e "${GREEN}▸ $*${NC}"; }
warn() { echo -e "${YELLOW}! $*${NC}"; }
err()  { echo -e "${RED}✗ $*${NC}"; }

# --- 1. Node.js -------------------------------------------------------------
need_node=true
if command -v node >/dev/null 2>&1; then
  major="$(node -v | sed 's/^v\([0-9]*\).*/\1/')"
  if [ "${major:-0}" -ge 18 ]; then
    say "Node.js $(node -v) уже установлен."
    need_node=false
  else
    warn "Node.js $(node -v) слишком старый (нужен >=18). Обновляю."
  fi
fi

if [ "$need_node" = true ]; then
  if ! command -v brew >/dev/null 2>&1; then
    say "Homebrew не найден — устанавливаю (потребуется пароль Mac)."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    # Подключаем brew в текущую сессию (Apple Silicon и Intel)
    if [ -x /opt/homebrew/bin/brew ]; then eval "$(/opt/homebrew/bin/brew shellenv)"; fi
    if [ -x /usr/local/bin/brew ]; then eval "$(/usr/local/bin/brew shellenv)"; fi
  fi
  say "Устанавливаю Node.js LTS через Homebrew."
  brew install node
fi

# --- 2. .env.local ----------------------------------------------------------
# Если ключ передан через переменную окружения X5_COPILOT_API_KEY —
# запишем его в .env.local. Так ключ остаётся только у вас и не попадает в git.
if [ ! -f .env.local ]; then
  if [ -f .env.example ]; then
    cp .env.example .env.local
    say "Создан .env.local из шаблона."
  fi
fi

if [ -n "${X5_COPILOT_API_KEY:-}" ] && [ -f .env.local ]; then
  # Подставляем ключ в .env.local (заменяем строку X5_COPILOT_API_KEY=...)
  tmp="$(mktemp)"
  grep -v '^X5_COPILOT_API_KEY=' .env.local > "$tmp" || true
  echo "X5_COPILOT_API_KEY=\"${X5_COPILOT_API_KEY}\"" >> "$tmp"
  mv "$tmp" .env.local
  say "Ключ X5 записан в .env.local."
elif grep -q 'your-key-here' .env.local 2>/dev/null; then
  warn "В .env.local пока стоит ключ-заглушка."
  warn "Впишите X5_COPILOT_API_KEY в .env.local или проверьте подключение в «Настройках»."
fi

# --- 3. Зависимости ---------------------------------------------------------
if [ ! -d node_modules ]; then
  say "Устанавливаю зависимости (npm install) — это может занять минуту."
  npm install
else
  say "Зависимости уже установлены."
fi

# --- 4. Запуск --------------------------------------------------------------
say "Запускаю сервер на http://localhost:3000"
say "Откройте эту ссылку в браузере. Остановить сервер — Ctrl+C."

# Открыть браузер с небольшой задержкой (после старта сервера)
( sleep 4; open "http://localhost:3000" >/dev/null 2>&1 || true ) &

exec npm run dev
