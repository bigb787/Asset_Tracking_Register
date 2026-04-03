data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

data "aws_ami" "ubuntu_noble" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd*/ubuntu-noble-24.04-amd64-server-*"]
  }

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

data "aws_caller_identity" "current" {}

locals {
  backup_bucket = coalesce(
    var.backup_bucket_name,
    "asset-register-backups-${data.aws_caller_identity.current.account_id}-${var.aws_region}"
  )

  user_data = <<-EOF
#!/bin/bash
set -euxo pipefail
export DEBIAN_FRONTEND=noninteractive

APP_DIR="/opt/asset-register"
REPO_URL="${var.app_repo_url}"
REPO_BRANCH="${var.app_repo_branch}"
APP_PORT="${var.app_port}"
BACKUP_BUCKET="${local.backup_bucket}"

apt-get update
apt-get install -y ca-certificates curl gnupg git nginx build-essential python3 python3-venv sqlite3 gzip unzip

# Ensure SSM is running (usually preinstalled, but safe to restart).
systemctl restart amazon-ssm-agent || true

curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "/tmp/awscliv2.zip"
unzip -o /tmp/awscliv2.zip -d /tmp
/tmp/aws/install --update

rm -rf "$APP_DIR"
git clone --depth 1 --branch "$REPO_BRANCH" "$REPO_URL" "$APP_DIR" || git clone --depth 1 "$REPO_URL" "$APP_DIR"

cd "$APP_DIR"
mkdir -p "$APP_DIR/data"
SUBAPP="$APP_DIR/asset-register"

# Flask app in asset-register/ (Gunicorn + systemd). Nginx proxies to APP_PORT.
if [ -f "$SUBAPP/app.py" ]; then
  python3 -m venv "$SUBAPP/.venv"
  "$SUBAPP/.venv/bin/pip" install --upgrade pip
  "$SUBAPP/.venv/bin/pip" install -r "$SUBAPP/requirements.txt"
  DB_PATH="$APP_DIR/data/asset_register.sqlite"
  cat > /etc/systemd/system/asset-register.service <<SYSTEMD
[Unit]
Description=Asset Register (Gunicorn)
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$SUBAPP
Environment=DATABASE_PATH=$DB_PATH
Environment=SECRET_KEY=change-me-in-production
Environment=GATEPASS_S3_BUCKET=${local.backup_bucket}
Environment=GATEPASS_S3_PREFIX=GatePass
EnvironmentFile=-$SUBAPP/.env
ExecStart=$SUBAPP/.venv/bin/gunicorn -w 2 -b 127.0.0.1:$APP_PORT app:app
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
SYSTEMD
  systemctl daemon-reload
  systemctl enable asset-register
  systemctl restart asset-register
else
  echo "asset-register/app.py not found in $REPO_URL; app will not start." | tee /var/log/asset-register-userdata.log
fi

# Expose the app on port 80 (reverse proxy to Node on APP_PORT)
cat > /etc/nginx/sites-available/asset-register <<NGINX
server {
  listen 80 default_server;
  server_name _;

  location / {
    proxy_pass http://127.0.0.1:$APP_PORT;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host \$host;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_cache_bypass \$http_upgrade;
  }
}
NGINX

ln -sf /etc/nginx/sites-available/asset-register /etc/nginx/sites-enabled/asset-register
rm -f /etc/nginx/sites-enabled/default || true
systemctl enable nginx
systemctl restart nginx

python3 --version

# Daily DB backup to S3
cat > /usr/local/bin/backup-asset-db.sh <<'BKP'
#!/bin/bash
set -euo pipefail
DB_PATH="/opt/asset-register/data/asset_register.sqlite"
TMP_DIR="/tmp/asset-register-backup"
BACKUP_BUCKET="${local.backup_bucket}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$TMP_DIR"
if [ ! -f "$DB_PATH" ]; then
  echo "Database file not found: $DB_PATH"
  exit 1
fi
sqlite3 "$DB_PATH" ".backup '$TMP_DIR/asset_register_$${STAMP}.sqlite'"
gzip -f "$TMP_DIR/asset_register_$${STAMP}.sqlite"
aws s3 cp "$TMP_DIR/asset_register_$${STAMP}.sqlite.gz" "s3://$BACKUP_BUCKET/sqlite/asset_register_$${STAMP}.sqlite.gz"
rm -f "$TMP_DIR"/asset_register_*.sqlite.gz
BKP

chmod +x /usr/local/bin/backup-asset-db.sh
echo "${var.backup_schedule_cron} root /usr/local/bin/backup-asset-db.sh >> /var/log/asset-register-backup.log 2>&1" > /etc/cron.d/asset-register-backup
chmod 644 /etc/cron.d/asset-register-backup
systemctl restart cron
EOF
}

resource "aws_security_group" "app" {
  name        = "asset-register-app-sg"
  description = "SSH, HTTP, and Node.js (3000) for Asset Register EC2"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
  }

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [var.allowed_app_cidr]
  }

  ingress {
    description = "Node.js app"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = [var.allowed_app_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "asset-register-app-sg"
  }
}

resource "aws_iam_role" "ec2_ssm_role" {
  name = "asset-register-ec2-ssm-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Project = "asset-register"
  }
}

resource "aws_iam_role_policy_attachment" "ec2_ssm_core" {
  role       = aws_iam_role.ec2_ssm_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy" "ec2_backup_s3_policy" {
  name = "asset-register-ec2-backup-s3-policy"
  role = aws_iam_role.ec2_ssm_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = ["s3:PutObject", "s3:AbortMultipartUpload"]
        Resource = [
          "arn:aws:s3:::${local.backup_bucket}/sqlite/*",
          "arn:aws:s3:::${local.backup_bucket}/GatePass/*"
        ]
      },
      {
        Effect = "Allow"
        Action = ["s3:ListBucket"]
        Resource = "arn:aws:s3:::${local.backup_bucket}"
      }
    ]
  })
}

resource "aws_s3_bucket" "backup" {
  bucket        = local.backup_bucket
  force_destroy = false

  tags = {
    Name    = local.backup_bucket
    Project = "asset-register"
    Purpose = "db-backup"
  }
}

resource "aws_s3_bucket_public_access_block" "backup" {
  bucket = aws_s3_bucket.backup.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "backup" {
  bucket = aws_s3_bucket.backup.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "backup" {
  bucket = aws_s3_bucket.backup.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "backup" {
  bucket = aws_s3_bucket.backup.id

  rule {
    id     = "expire-old-backups"
    status = "Enabled"

    filter {
      prefix = "sqlite/"
    }

    expiration {
      days = var.backup_retention_days
    }

    noncurrent_version_expiration {
      noncurrent_days = var.backup_retention_days
    }
  }
}

resource "aws_iam_instance_profile" "ec2_ssm_profile" {
  name = "asset-register-ec2-ssm-profile"
  role = aws_iam_role.ec2_ssm_role.name
}

resource "aws_instance" "app" {
  ami                    = data.aws_ami.ubuntu_noble.id
  instance_type          = var.instance_type
  key_name               = var.key_name
  vpc_security_group_ids = [aws_security_group.app.id]
  subnet_id              = sort(data.aws_subnets.default.ids)[0]
  user_data              = local.user_data
  iam_instance_profile   = aws_iam_instance_profile.ec2_ssm_profile.name

  associate_public_ip_address = var.associate_public_ip

  root_block_device {
    volume_type           = "gp3"
    volume_size           = 20
    delete_on_termination = true
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  tags = {
    Name    = "asset-register-ubuntu"
    Project = "asset-register"
  }
}
