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

locals {
  user_data = <<-EOF
    #!/bin/bash
    set -euxo pipefail
    export DEBIAN_FRONTEND=noninteractive

    APP_DIR="/opt/asset-register"
    REPO_URL="${var.app_repo_url}"
    REPO_BRANCH="${var.app_repo_branch}"
    APP_PORT="${var.app_port}"

    apt-get update
    apt-get install -y ca-certificates curl gnupg git nginx build-essential python3

    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    npm install -g pm2

    rm -rf "$APP_DIR"
    git clone --depth 1 --branch "$REPO_BRANCH" "$REPO_URL" "$APP_DIR" || git clone --depth 1 "$REPO_URL" "$APP_DIR"

    cd "$APP_DIR"

    # Start the Node app if this repo contains a runnable Node project.
    if [ -f package.json ]; then
      npm install --omit=dev || npm install

      pm2 delete asset-register || true
      PORT="$APP_PORT" pm2 start npm --name asset-register -- start
      pm2 save

      # Ensure PM2 restarts on reboot
      env PATH="$PATH:/usr/bin" pm2 startup systemd -u root --hp /root || true
    else
      echo "package.json not found in $REPO_URL; app will not start." | tee /var/log/asset-register-userdata.log
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

    node --version
    npm --version
    pm2 --version
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

resource "aws_instance" "app" {
  ami                    = data.aws_ami.ubuntu_noble.id
  instance_type          = var.instance_type
  key_name               = var.key_name
  vpc_security_group_ids = [aws_security_group.app.id]
  subnet_id              = sort(data.aws_subnets.default.ids)[0]
  user_data              = base64encode(local.user_data)

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
    Name = "asset-register-ubuntu"
  }
}
