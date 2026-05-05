terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  required_version = ">= 1.7.0"
}

provider "aws" {
  region = var.aws_region
}

# ─── SSH Key Pair ────────────────────────────────────────────────────────────
resource "aws_key_pair" "parksim_key" {
  key_name   = "parksim-key"
  public_key = file(var.public_key_path)

  tags = {
    Name    = "ParkSim-KeyPair"
    Project = "ParkSim-OS"
  }
}

# ─── Security Group ──────────────────────────────────────────────────────────
resource "aws_security_group" "parksim_sg" {
  name        = "parksim-sg"
  description = "ParkSim OS Security Group - Allows SSH, HTTP, and microservice ports"

  # SSH
  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTP
  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Microservice ports (API Gateway → Notification Service)
  ingress {
    description = "Microservices"
    from_port   = 3000
    to_port     = 3003
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Jenkins
  ingress {
    description = "Jenkins"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # SonarQube
  ingress {
    description = "SonarQube"
    from_port   = 9000
    to_port     = 9000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # All outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "ParkSim-SG"
    Project = "ParkSim-OS"
  }
}

# ─── EC2 Instance ─────────────────────────────────────────────────────────────
resource "aws_instance" "parksim" {
  ami                    = var.ami_id          # Ubuntu 22.04 LTS (us-east-1)
  instance_type          = var.instance_type
  key_name               = aws_key_pair.parksim_key.key_name
  vpc_security_group_ids = [aws_security_group.parksim_sg.id]

  # Automatically install Docker on first boot
  user_data = <<-EOF
    #!/bin/bash
    apt-get update -y
    apt-get install -y docker.io docker-compose-v2 git
    systemctl start docker
    systemctl enable docker
    usermod -aG docker ubuntu
  EOF

  root_block_device {
    volume_size = 20  # GB
    volume_type = "gp3"
  }

  tags = {
    Name    = "ParkSim-Server"
    Project = "ParkSim-OS"
    Env     = "production"
  }
}

# ─── Outputs ──────────────────────────────────────────────────────────────────
output "public_ip" {
  description = "Public IP address of the ParkSim EC2 instance"
  value       = aws_instance.parksim.public_ip
}

output "public_dns" {
  description = "Public DNS of the ParkSim EC2 instance"
  value       = aws_instance.parksim.public_dns
}

output "instance_id" {
  description = "EC2 Instance ID"
  value       = aws_instance.parksim.id
}

output "app_url" {
  description = "URL to access the ParkSim application"
  value       = "http://${aws_instance.parksim.public_ip}"
}
