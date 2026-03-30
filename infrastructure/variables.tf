variable "aws_region" {
  description = "AWS region for the EC2 instance and security group."
  type        = string
  default     = "us-east-1"
}

variable "instance_type" {
  description = "EC2 instance type."
  type        = string
  default     = "t3.micro"
}

variable "key_name" {
  description = "Optional EC2 Key Pair name for SSH (recommended)."
  type        = string
  default     = null
}

variable "allowed_ssh_cidr" {
  description = "CIDR allowed to reach SSH (port 22). Restrict to your IP in production."
  type        = string
  default     = "0.0.0.0/0"
}

variable "allowed_app_cidr" {
  description = "CIDR allowed to reach HTTP (80) and the Node app (3000)."
  type        = string
  default     = "0.0.0.0/0"
}

variable "associate_public_ip" {
  description = "Associate a public IP so the instance is reachable from the internet."
  type        = bool
  default     = true
}

variable "app_repo_url" {
  description = "GitHub repository URL for the Node.js app."
  type        = string
  default     = "https://github.com/bigb787/Asset_Tracking_Register.git"
}

variable "app_repo_branch" {
  description = "Git branch to clone from the app repository."
  type        = string
  default     = "main"
}

variable "app_port" {
  description = "Port where the Node.js app listens."
  type        = number
  default     = 3000
}

variable "backup_bucket_name" {
  description = "Optional S3 bucket name for SQLite backups. If null, a deterministic name is generated."
  type        = string
  default     = null
}

variable "backup_retention_days" {
  description = "Retention period in days for S3 database backups."
  type        = number
  default     = 30
}

variable "backup_schedule_cron" {
  description = "Cron schedule for backup script on EC2."
  type        = string
  default     = "30 2 * * *"
}
