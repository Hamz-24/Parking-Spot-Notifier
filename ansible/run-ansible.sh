#!/bin/bash
# =============================================================================
# ParkSim OS — Ansible Setup for WSL
# Run this inside WSL (Ubuntu) after EC2 is provisioned by Terraform
# =============================================================================

echo ""
echo "============================================================"
echo "  ParkSim OS - Ansible Server Configuration"
echo "============================================================"
echo ""

# ─── Install Ansible in WSL ──────────────────────────────────────────────────
echo "[1/3] Installing Ansible..."
if command -v ansible-playbook &> /dev/null; then
    echo "  -> Ansible already installed: $(ansible --version | head -1)"
else
    sudo apt-get update -y
    sudo apt-get install -y ansible
    echo "  -> Ansible installed!"
fi

# ─── Copy SSH key from Windows to WSL ────────────────────────────────────────
echo ""
echo "[2/3] Setting up SSH key..."
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Copy key from Windows user profile to WSL
WINDOWS_SSH="/mnt/c/Users/$USER/.ssh/id_rsa"
if [ -f "$WINDOWS_SSH" ]; then
    cp "$WINDOWS_SSH" ~/.ssh/id_rsa
    chmod 600 ~/.ssh/id_rsa
    echo "  -> SSH private key copied from Windows!"
else
    echo "  -> Looking for SSH key..."
    # Try common Windows username paths
    for WIN_USER in /mnt/c/Users/*/; do
        if [ -f "${WIN_USER}.ssh/id_rsa" ]; then
            cp "${WIN_USER}.ssh/id_rsa" ~/.ssh/id_rsa
            chmod 600 ~/.ssh/id_rsa
            echo "  -> SSH private key found and copied from: $WIN_USER"
            break
        fi
    done
fi

# ─── Run Ansible Playbook ─────────────────────────────────────────────────────
echo ""
echo "[3/3] Running Ansible Playbook to configure EC2..."
echo "      This installs: Docker, Nginx, Git on your EC2 instance"
echo ""

# Get the project path in WSL format
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT/ansible"

echo "Checking EC2 connectivity first..."
EC2_IP=$(cat "$PROJECT_ROOT/.ec2-ip" 2>/dev/null || echo "")

if [ -z "$EC2_IP" ]; then
    echo "  -> .ec2-ip file not found."
    read -p "  -> Enter EC2 Public IP (from 'terraform output public_ip'): " EC2_IP
fi

echo "Testing SSH connection to $EC2_IP..."
ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 -i ~/.ssh/id_rsa ubuntu@$EC2_IP "echo 'SSH connection successful!'"
if [ $? -ne 0 ]; then
    echo "ERROR: Cannot SSH to EC2 at $EC2_IP"
    echo "Make sure: 1) EC2 is running  2) Security group allows port 22"
    exit 1
fi

echo ""
echo "Running playbook... (takes 3-5 minutes)"
ansible-playbook -i inventory.ini playbook.yml -v

if [ $? -eq 0 ]; then
    echo ""
    echo "============================================================"
    echo "  EC2 Configured Successfully!"
    echo "============================================================"
    echo ""
    echo "  EC2 IP: $EC2_IP"
    echo "  Nginx + Docker are now running on your EC2!"
    echo ""
    echo "NEXT STEP: Configure Jenkins to deploy to this EC2"
    echo "  Open: http://localhost:8080"
    echo "  Follow: DEMO-GUIDE.md"
else
    echo "ERROR: Ansible playbook failed!"
    echo "Check the output above for errors."
fi
