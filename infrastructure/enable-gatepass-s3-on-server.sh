#!/usr/bin/env bash
# Run on the Asset Register EC2 instance (SSH or SSM Session Manager) once after deploy.
# Installs boto3 via requirements.txt and adds GATEPASS_S3_* to systemd without replacing the whole unit.
set -euxo pipefail

SUBAPP="${SUBAPP:-/opt/asset-register/asset-register}"
BUCKET="${GATEPASS_S3_BUCKET:-asset-register-backups-755231954480-us-east-1}"
PREFIX="${GATEPASS_S3_PREFIX:-GatePass}"

if [[ ! -f "$SUBAPP/.venv/bin/pip" ]]; then
  echo "Expected venv at $SUBAPP/.venv — clone/pull the app and run user_data first." >&2
  exit 1
fi

"$SUBAPP/.venv/bin/pip" install --upgrade pip
"$SUBAPP/.venv/bin/pip" install -r "$SUBAPP/requirements.txt"

mkdir -p /etc/systemd/system/asset-register.service.d
cat >/etc/systemd/system/asset-register.service.d/gatepass-s3.conf <<EOF
[Service]
Environment=GATEPASS_S3_BUCKET=$BUCKET
Environment=GATEPASS_S3_PREFIX=$PREFIX
EOF

systemctl daemon-reload
systemctl restart asset-register
systemctl --no-pager --full status asset-register || true
echo "Done. Gatepass PDFs should upload to s3://$BUCKET/$PREFIX/"
