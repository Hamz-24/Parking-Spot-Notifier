# =============================================================================
# ParkSim OS — SSH Key Generator
# Creates the SSH key pair used by Terraform + Ansible to access EC2
# =============================================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  ParkSim OS - SSH Key Generator" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$sshDir    = "$env:USERPROFILE\.ssh"
$keyPath   = "$sshDir\id_rsa"
$pubPath   = "$sshDir\id_rsa.pub"

# Create .ssh directory if it doesn't exist
New-Item -ItemType Directory -Force -Path $sshDir | Out-Null

# Check if key already exists
if (Test-Path $pubPath) {
    Write-Host "SSH key already exists at: $pubPath" -ForegroundColor Green
    Write-Host ""
    Write-Host "Public Key Content:" -ForegroundColor Yellow
    Get-Content $pubPath
} else {
    Write-Host "Generating RSA 4096 SSH key pair..." -ForegroundColor Yellow

    # Use ssh-keygen (comes with Git for Windows)
    $email = Read-Host "Enter your email (for key label, e.g. hamza@student.edu)"
    & ssh-keygen -t rsa -b 4096 -C $email -f $keyPath -N '""'

    if (Test-Path $pubPath) {
        Write-Host ""
        Write-Host "  -> SSH Key generated successfully!" -ForegroundColor Green
        Write-Host "  -> Private key: $keyPath  (KEEP SECRET - never share!)" -ForegroundColor White
        Write-Host "  -> Public key:  $pubPath  (this goes to AWS)" -ForegroundColor White
        Write-Host ""
        Write-Host "Public Key Content:" -ForegroundColor Yellow
        Get-Content $pubPath
    } else {
        Write-Host "  -> ERROR: ssh-keygen not found." -ForegroundColor Red
        Write-Host "     Install Git for Windows: https://git-scm.com/download/win" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  SSH Key Ready!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "NEXT STEP: Run  .\terraform-deploy.ps1  to provision AWS EC2" -ForegroundColor Yellow
Write-Host ""
