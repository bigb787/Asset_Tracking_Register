#!/usr/bin/env bash
# Deploy from repo root: /opt/asset-register (git clone target in Terraform).
# Run on the server after `git pull` (see .github/workflows/deploy.yml).
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$APP_DIR/.." && pwd)"
PORT="${ASSET_REGISTER_PORT:-3000}"
DB_PATH="${DATABASE_PATH:-$REPO_ROOT/data/asset_register.sqlite}"

cd "$REPO_ROOT"
git fetch --all
current="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)"
git checkout "$current"
git pull --rebase || true

mkdir -p "$(dirname "$DB_PATH")"

cd "$APP_DIR"
python3 -m venv .venv
# shellcheck source=/dev/null
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

UNIT="/etc/systemd/system/asset-register.service"
if [ ! -f "$UNIT" ]; then
  cat >"$UNIT" <<EOF
[Unit]
Description=Asset Register (Gunicorn)
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$APP_DIR
Environment=DATABASE_PATH=$DB_PATH
Environment=SECRET_KEY=${SECRET_KEY:-change-me-in-production}
EnvironmentFile=-$APP_DIR/.env
ExecStart=$APP_DIR/.venv/bin/gunicorn -w 2 -b 127.0.0.1:$PORT app:app
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF
  systemctl daemon-reload
  systemctl enable asset-register
fi

systemctl restart asset-register
systemctl --no-pager --full status asset-register || true
