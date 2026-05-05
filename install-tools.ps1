# =============================================================================
# ParkSim OS — DevOps Tools Installer
# Run as Administrator in PowerShell
# =============================================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  ParkSim OS - DevOps Tools Installer" -ForegroundColor Cyan
Write-Host "  Installing: Chocolatey, Terraform, AWS CLI, Git" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "ERROR: Please run this script as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell -> Run as Administrator" -ForegroundColor Yellow
    exit 1
}

# ─── Step 1: Install Chocolatey ───────────────────────────────────────────────
Write-Host "[1/4] Installing Chocolatey (Windows Package Manager)..." -ForegroundColor Yellow
if (Get-Command choco -ErrorAction SilentlyContinue) {
    Write-Host "  -> Chocolatey already installed. Skipping." -ForegroundColor Green
} else {
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    Write-Host "  -> Chocolatey installed!" -ForegroundColor Green
}

# Refresh environment
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# ─── Step 2: Install Terraform ────────────────────────────────────────────────
Write-Host ""
Write-Host "[2/4] Installing Terraform..." -ForegroundColor Yellow
if (Get-Command terraform -ErrorAction SilentlyContinue) {
    $tfVersion = terraform version | Select-Object -First 1
    Write-Host "  -> Terraform already installed: $tfVersion" -ForegroundColor Green
} else {
    choco install terraform -y
    Write-Host "  -> Terraform installed!" -ForegroundColor Green
}

# ─── Step 3: Install AWS CLI ──────────────────────────────────────────────────
Write-Host ""
Write-Host "[3/4] Installing AWS CLI..." -ForegroundColor Yellow
if (Get-Command aws -ErrorAction SilentlyContinue) {
    $awsVersion = aws --version
    Write-Host "  -> AWS CLI already installed: $awsVersion" -ForegroundColor Green
} else {
    choco install awscli -y
    Write-Host "  -> AWS CLI installed!" -ForegroundColor Green
}

# ─── Step 4: Install Git (if missing) ────────────────────────────────────────
Write-Host ""
Write-Host "[4/4] Checking Git..." -ForegroundColor Yellow
if (Get-Command git -ErrorAction SilentlyContinue) {
    $gitVersion = git --version
    Write-Host "  -> Git already installed: $gitVersion" -ForegroundColor Green
} else {
    choco install git -y
    Write-Host "  -> Git installed!" -ForegroundColor Green
}

# Refresh environment again
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# ─── Summary ──────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  Installation Complete!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Versions installed:" -ForegroundColor Cyan
try { terraform version | Select-Object -First 1 | Write-Host -ForegroundColor White } catch {}
try { aws --version | Write-Host -ForegroundColor White } catch {}
try { git --version | Write-Host -ForegroundColor White } catch {}
Write-Host ""
Write-Host "NEXT STEP: Run  .\configure-aws.ps1  to set your AWS credentials" -ForegroundColor Yellow
Write-Host ""
