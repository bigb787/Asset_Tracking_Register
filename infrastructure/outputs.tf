output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.app.id
}

output "public_ip" {
  description = "Public IPv4 (if associated)"
  value       = aws_instance.app.public_ip
}

output "public_dns" {
  description = "Public DNS name"
  value       = aws_instance.app.public_dns
}

output "security_group_id" {
  description = "Security group attached to the instance"
  value       = aws_security_group.app.id
}

output "ami_used" {
  description = "Resolved Ubuntu 24.04 AMI ID"
  value       = data.aws_ami.ubuntu_noble.id
}

output "backup_bucket_name" {
  description = "S3 bucket used for SQLite backups"
  value       = aws_s3_bucket.backup.bucket
}
