# =============================================================================
# ParkSim OS — One-Click DevOps Startup Script
# Starts Jenkins + SonarQube, then prints all URLs
# Run this AFTER Docker Desktop is installed and running
# =============================================================================

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  ParkSim OS - DevOps Stack Startup" -ForegroundColor Cyan
Write-Host "  Starting: Jenkins + SonarQube" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = $PSScriptRoot
$devopsDir   = Join-Path $projectRoot "devops"

# ─── Step 1: Check Docker is running ─────────────────────────────────────────
Write-Host "[1/4] Checking Docker Desktop..." -ForegroundColor Yellow
try {
    docker info 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Docker not running" }
    Write-Host "  -> Docker Desktop is running!" -ForegroundColor Green
} catch {
    Write-Host "  -> ERROR: Docker Desktop is not running!" -ForegroundColor Red
    Write-Host "     Please start Docker Desktop and try again." -ForegroundColor Yellow
    Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe" -ErrorAction SilentlyContinue
    Write-Host "     Attempting to start Docker Desktop..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
}

# ─── Step 2: Fix WSL2 memory for SonarQube ────────────────────────────────────
Write-Host ""
Write-Host "[2/4] Setting vm.max_map_count for SonarQube (requires WSL2)..." -ForegroundColor Yellow
try {
    wsl -e sysctl -w vm.max_map_count=262144 2>$null
    Write-Host "  -> vm.max_map_count set to 262144" -ForegroundColor Green
} catch {
    Write-Host "  -> WSL command skipped (may already be configured)" -ForegroundColor Gray
}

# ─── Step 3: Build Jenkins image ─────────────────────────────────────────────
Write-Host ""
Write-Host "[3/4] Building custom Jenkins image (first time takes 5-10 mins)..." -ForegroundColor Yellow
Set-Location $devopsDir
docker compose -f docker-compose.devops.yml build jenkins
if ($LASTEXITCODE -ne 0) {
    Write-Host "  -> Build failed! Check your internet connection." -ForegroundColor Red
    Set-Location $projectRoot
    exit 1
}
Write-Host "  -> Jenkins image built!" -ForegroundColor Green

# ─── Step 4: Start all containers ─────────────────────────────────────────────
Write-Host ""
Write-Host "[4/4] Starting Jenkins + SonarQube containers..." -ForegroundColor Yellow
docker compose -f docker-compose.devops.yml up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "  -> Failed to start containers!" -ForegroundColor Red
    Set-Location $projectRoot
    exit 1
}
Write-Host "  -> Containers started!" -ForegroundColor Green

Set-Location $projectRoot

# ─── Wait for services ────────────────────────────────────────────────────────
Write-Host ""
Write-Host "Waiting for Jenkins and SonarQube to be ready..." -ForegroundColor Yellow
Write-Host "(This can take 2-3 minutes on first start)" -ForegroundColor Gray
Write-Host ""

$jenkinsReady = $false
$sonarReady   = $false
$maxWait = 60  # max 5 minutes (60 * 5s)

for ($i = 0; $i -lt $maxWait; $i++) {
    $progress = [math]::Round(($i / $maxWait) * 100)
    Write-Progress -Activity "Waiting for services..." -Status "$progress% complete" -PercentComplete $progress

    if (-not $jenkinsReady) {
        try {
            $r = Invoke-WebRequest -Uri "http://localhost:8080/login" -TimeoutSec 3 -UseBasicParsing -ErrorAction SilentlyContinue
            if ($r.StatusCode -eq 200) {
                $jenkinsReady = $true
                Write-Host "  ✅ Jenkins is ready!" -ForegroundColor Green
            }
        } catch {}
    }

    if (-not $sonarReady) {
        try {
            $r = Invoke-WebRequest -Uri "http://localhost:9000/api/system/status" -TimeoutSec 3 -UseBasicParsing -ErrorAction SilentlyContinue
            if ($r.Content -match '"status":"UP"') {
                $sonarReady = $true
                Write-Host "  ✅ SonarQube is ready!" -ForegroundColor Green
            }
        } catch {}
    }

    if ($jenkinsReady -and $sonarReady) { break }
    Start-Sleep -Seconds 5
}

Write-Progress -Activity "Waiting for services..." -Completed

# ─── Get Jenkins Initial Password ─────────────────────────────────────────────
Write-Host ""
Write-Host "Getting Jenkins initial admin password..." -ForegroundColor Yellow
try {
    $jenkinsPass = docker exec parksim-jenkins cat /var/jenkins_home/secrets/initialAdminPassword 2>$null
    if ($jenkinsPass) {
        Write-Host "  Jenkins Initial Password: $jenkinsPass" -ForegroundColor Magenta
    }
} catch {
    Write-Host "  (Jenkins may auto-skip setup wizard)" -ForegroundColor Gray
}

# ─── Final Output ─────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "======================================================================" -ForegroundColor Green
Write-Host "  ParkSim OS DevOps Stack is LIVE!" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Jenkins   → http://localhost:8080" -ForegroundColor Cyan
Write-Host "  SonarQube → http://localhost:9000  (admin/admin)" -ForegroundColor Cyan
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "  1. Open Jenkins:   http://localhost:8080" -ForegroundColor White
Write-Host "  2. Open DEMO-GUIDE.md for step-by-step Jenkins setup" -ForegroundColor White
Write-Host "  3. Run: .\terraform-deploy.ps1  to provision EC2" -ForegroundColor White
Write-Host ""
Write-Host "To STOP everything:" -ForegroundColor Yellow
Write-Host "  docker compose -f devops\docker-compose.devops.yml down" -ForegroundColor White
Write-Host ""
