variable "aws_region" {
  description = "AWS region where resources will be created"
  type        = string
  default     = "us-east-1"
}

variable "ami_id" {
  description = "AMI ID for Ubuntu 22.04 LTS in us-east-1"
  type        = string
  default     = "ami-0a0e5d9c7a9c1e8a9"
  # Ubuntu 22.04 LTS (Jammy) us-east-1 — updated May 2026
  # To find latest: aws ec2 describe-images --owners 099720109477 \
  #   --filters "Name=name,Values=ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*" \
  #   --query 'sort_by(Images,&CreationDate)[-1].ImageId' --region us-east-1
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
  # t3.micro is free-tier eligible in us-east-1 (2026). 2 vCPU, 1GB RAM.
}

variable "public_key_path" {
  description = "Path to your SSH public key for EC2 key pair"
  type        = string
  default     = "~/.ssh/id_rsa.pub"
}

variable "project_name" {
  description = "Project name used for tagging"
  type        = string
  default     = "ParkSim-OS"
}
