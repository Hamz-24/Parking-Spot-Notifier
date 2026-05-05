# ParkSim OS — DevOps Implementation Guide

**Sardar Patel Institute of Technology**  
Department of Computer Engineering | DevOps Lab Project

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Folder Structure](#3-folder-structure)
4. [Step 1 — Terraform: Provision AWS Infrastructure](#4-step-1--terraform-provision-aws-infrastructure)
5. [Step 2 — Docker: Containerize the Application](#5-step-2--docker-containerize-the-application)
6. [Step 3 — Ansible: Configure the EC2 Server](#6-step-3--ansible-configure-the-ec2-server)
7. [Step 4 — SonarQube: Code Quality Gate](#7-step-4--sonarqube-code-quality-gate)
8. [Step 5 — Jenkins: CI/CD Pipeline](#8-step-5--jenkins-cicd-pipeline)
9. [Quick Reference Commands](#9-quick-reference-commands)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Project Overview

ParkSim OS is a **microservices-based Parking Notification System** built with Node.js and Express. The application demonstrates:

- **Real-time slot monitoring** with Server-Sent Events (SSE)
- **JWT-based authentication** with role access control
- **Inter-service communication** across 4 independent services

This document covers the complete DevOps implementation to provision infrastructure, configure servers, containerize services, and establish a full CI/CD pipeline with automated code quality gates.

### 1.1 DevOps Tools Used

| Tool | Version | Purpose |
|------|---------|---------|
| Terraform | v1.7+ | Provision EC2 instance and security groups on AWS |
| Ansible | v2.15+ | Configure the EC2 server — install Docker, Nginx, PM2 |
| Jenkins | LTS | CI/CD pipeline — build, test, scan, and deploy on git push |
| Docker / Compose | v24+ | Containerize all 4 services + MySQL |
| SonarQube | Community | Static code analysis and quality gate inside Jenkins pipeline |

---

## 2. Architecture

### 2.1 Application Microservices

| Service | Port | Responsibility |
|---------|------|----------------|
| API Gateway | 3000 | Single entry point, reverse proxy, serves frontend |
| User Service | 3001 | Register / Login, JWT auth, bcrypt hashing, role management |
| Parking Service | 3002 | Manage spots, update Free/Occupied status, notify on change |
| Notification Service | 3003 | SSE stream, broadcasts spot_freed / spot_busy events to browsers |

### 2.2 Pipeline Flow

```
Developer pushes code
        │
        ▼
   GitHub Webhook
        │
        ▼
   Jenkins Pipeline
   ┌────────────────────────────────────────┐
   │ 1. Clone Repository                    │
   │ 2. npm install (all 4 services)        │
   │ 3. SonarQube Static Analysis           │
   │ 4. Quality Gate Check ──fail──► STOP   │
   │ 5. Docker Build Images                 │
   │ 6. Deploy to EC2 via SSH               │
   └────────────────────────────────────────┘
        │
        ▼
   EC2 (via Ansible)
   ┌─────────────────────────────────────────┐
   │ Nginx :80 → API Gateway :3000           │
   │  ├── /auth → User Service :3001         │
   │  ├── /parking → Parking Service :3002   │
   │  └── /notification → Notification :3003 │
   └─────────────────────────────────────────┘
```

---

## 3. Folder Structure

```
parksim-os/
├── backend/
│   ├── api-gateway/
│   │   ├── server.js
│   │   ├── Dockerfile          ← NEW
│   │   └── .dockerignore       ← NEW
│   ├── user-service/
│   │   ├── server.js
│   │   ├── auth/
│   │   ├── config/
│   │   ├── Dockerfile          ← NEW
│   │   └── .dockerignore       ← NEW
│   ├── parking-service/
│   │   ├── server.js
│   │   ├── parking/
│   │   ├── config/
│   │   ├── Dockerfile          ← NEW
│   │   └── .dockerignore       ← NEW
│   └── notification-service/
│       ├── server.js
│       ├── notification/
│       ├── Dockerfile          ← NEW
│       └── .dockerignore       ← NEW
├── frontend/
│   ├── index.html
│   ├── css/
│   └── js/
├── terraform/                  ← NEW
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
├── ansible/                    ← NEW
│   ├── inventory.ini
│   └── playbook.yml
├── docker-compose.yml          ← NEW
├── Jenkinsfile                 ← NEW
├── sonar-project.properties    ← NEW
└── database-init.sql
```

---

## 4. Step 1 — Terraform: Provision AWS Infrastructure

Terraform creates the EC2 instance on AWS automatically — no manual console clicks needed.

### What Terraform Creates
- EC2 t2.micro instance (Ubuntu 22.04)
- Security Group (ports: 22, 80, 3000-3003, 8080, 9000)
- SSH Key Pair for server access
- Outputs the public IP address

### Prerequisites
```bash
# 1. Install Terraform (Windows)
winget install HashiCorp.Terraform

# 2. Configure AWS credentials
aws configure
# Enter: Access Key ID, Secret Access Key, Region (us-east-1), output format (json)

# 3. Generate SSH key pair (if you don't have one)
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa
```

### Commands
```bash
cd terraform/

# Download AWS provider plugin
terraform init

# Preview what will be created (dry run — safe)
terraform plan

# Create the EC2 instance on AWS
terraform apply

# Note down the public_ip output! You need it for Ansible.

# Tear down all infrastructure (when done)
terraform destroy
```

---

## 5. Step 2 — Docker: Containerize the Application

Each service has its own `Dockerfile`. Docker Compose orchestrates all 4 services + MySQL.

### Run Locally with Docker Compose
```bash
# Build all images and start all services
docker compose up -d --build

# Check service status
docker compose ps

# View logs for a specific service
docker compose logs parking-service -f

# Stop everything
docker compose down

# Stop and remove volumes (wipes database)
docker compose down -v
```

### Service URLs (after compose up)
| Service | URL |
|---------|-----|
| Frontend + API Gateway | http://localhost:3000 |
| User Service | http://localhost:3001 |
| Parking Service | http://localhost:3002 |
| Notification Service | http://localhost:3003 |

---

## 6. Step 3 — Ansible: Configure the EC2 Server

After Terraform creates the EC2 instance, Ansible automates the entire server setup.

### What Ansible Does
1. SSHes into the EC2 instance
2. Updates Ubuntu packages
3. Installs Docker, Docker Compose, Nginx, Git
4. Copies project files to the server
5. Starts all 4 services via `docker compose up`
6. Configures Nginx to forward port 80 → port 3000

### Setup
```bash
# 1. Edit ansible/inventory.ini
# Replace <YOUR_EC2_PUBLIC_IP> with the IP from: terraform output public_ip

# 2. Run the playbook
ansible-playbook -i ansible/inventory.ini ansible/playbook.yml

# The app will be live at: http://<EC2-PUBLIC-IP>
```

---

## 7. Step 4 — SonarQube: Code Quality Gate

SonarQube performs static analysis on the Node.js source code.

### Start SonarQube (Docker)
```bash
docker run -d --name sonarqube -p 9000:9000 sonarqube:community

# Access dashboard: http://localhost:9000
# Default login: admin / admin (change on first login!)
```

### Setup in Jenkins
1. Go to Jenkins → Manage Jenkins → Configure System
2. Add SonarQube server: Name = `SonarQube`, URL = `http://localhost:9000`
3. Generate a token in SonarQube: My Account → Security → Generate Token
4. Add token to Jenkins Credentials as `SONAR_TOKEN`

### Quality Gate Thresholds
| Metric | Threshold | Action if Failed |
|--------|-----------|-----------------|
| Bugs | 0 new bugs | Pipeline fails |
| Vulnerabilities | 0 critical/major | Pipeline fails |
| Code Smells | < 10 new | Warning |
| Coverage | > 60% | Warning |
| Duplications | < 3% | Warning |

### Manual Scan (for testing)
```bash
# Install sonar-scanner globally
npm install -g sonar-scanner

# Run scan from project root
sonar-scanner -Dsonar.token=<YOUR_TOKEN>
```

---

## 8. Step 5 — Jenkins: CI/CD Pipeline

Jenkins ties everything together — every push to GitHub triggers the full pipeline.

### Jenkins Setup Steps

| Step | Action |
|------|--------|
| 1 | Install Jenkins (via Docker or installer) |
| 2 | Install plugins: Git, Pipeline, SonarQube Scanner, Docker Pipeline, SSH Agent, Credentials |
| 3 | Add credentials: `EC2_PUBLIC_IP` (plain text), `SONAR_TOKEN` (secret text), `ec2-ssh-key` (SSH private key) |
| 4 | Configure SonarQube server in Jenkins → Configure System |
| 5 | Create a Pipeline job → point to your GitHub repo's `Jenkinsfile` |
| 6 | Add GitHub Webhook: `http://<JENKINS_IP>:8080/github-webhook/` |
| 7 | Push code → pipeline auto-triggers |

### Run Jenkins via Docker
```bash
docker run -d \
  --name jenkins \
  -p 8080:8080 \
  -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  jenkins/jenkins:lts

# Get initial admin password:
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
# Access: http://localhost:8080
```

---

## 9. Quick Reference Commands

### Terraform
```bash
cd terraform/
terraform init && terraform apply
terraform output public_ip        # Get the EC2 IP
terraform destroy                  # Tear down
```

### Ansible
```bash
ansible-playbook -i ansible/inventory.ini ansible/playbook.yml
ansible-playbook -i ansible/inventory.ini ansible/playbook.yml --check   # Dry run
```

### Docker (local or on EC2)
```bash
docker compose up -d --build            # Start all services
docker compose ps                        # Check status
docker compose logs api-gateway -f       # Follow gateway logs
docker compose logs parking-service -f   # Follow parking logs
docker compose down                      # Stop all
docker compose down -v                   # Stop + wipe volumes
docker image prune -f                    # Clean unused images
```

### SonarQube
```bash
docker run -d -p 9000:9000 sonarqube:community   # Start SonarQube
sonar-scanner -Dsonar.token=<token>               # Run manual scan
```

### Jenkins
```bash
# Via Docker:
docker start jenkins
# Trigger: push to GitHub or Jenkins Dashboard → Build Now
```

---

## 10. Troubleshooting

| Issue | Likely Cause | Fix |
|-------|-------------|-----|
| `terraform apply` fails | AWS credentials not configured | Run: `aws configure` |
| Ansible: connection refused | Wrong IP or SSH key mismatch | Check `inventory.ini` and key pair |
| SonarQube gate fails | Bugs/vulnerabilities in code | Fix issues shown in SonarQube dashboard at `:9000` |
| Docker build fails | Missing Dockerfile or wrong port | Check each service has correct Dockerfile |
| Nginx 502 error | Services not started | Run: `docker compose ps` — check all services are `Up` |
| Jenkins can't SSH to EC2 | SSH key not added to Jenkins | Add `ec2-ssh-key` credential in Jenkins |
| Port already in use | Another process on port 3000/3001/etc | `netstat -ano | findstr :3000` → kill process |

---

*ParkSim OS — DevOps Implementation Guide | Sardar Patel Institute of Technology*
   
 