# =============================================================================
# ParkSim OS — AWS Credentials Setup
# Run AFTER install-tools.ps1
# =============================================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  ParkSim OS - AWS Credentials Configuration" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "You need your AWS Access Keys from:" -ForegroundColor Yellow
Write-Host "  AWS Console -> Your Name (top right) -> Security Credentials" -ForegroundColor Yellow
Write-Host "  -> Access Keys -> Create Access Key -> CLI" -ForegroundColor Yellow
Write-Host ""

# ─── Get Credentials from User ───────────────────────────────────────────────
$accessKeyId = Read-Host "Enter your AWS Access Key ID"
$secretKey   = Read-Host "Enter your AWS Secret Access Key" -AsSecureString
$secretKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secretKey)
)

Write-Host ""
Write-Host "Configuring AWS CLI..." -ForegroundColor Yellow

# Write to AWS credentials file directly (more reliable than interactive aws configure)
$awsDir = "$env:USERPROFILE\.aws"
New-Item -ItemType Directory -Force -Path $awsDir | Out-Null

$credentialsContent = @"
[default]
aws_access_key_id = $accessKeyId
aws_secret_access_key = $secretKeyPlain
"@

$configContent = @"
[default]
region = us-east-1
output = json
"@

$credentialsContent | Out-File -FilePath "$awsDir\credentials" -Encoding ASCII
$configContent      | Out-File -FilePath "$awsDir\config"      -Encoding ASCII

Write-Host "  -> Credentials written to $awsDir\credentials" -ForegroundColor Green

# ─── Verify Connection ────────────────────────────────────────────────────────
Write-Host ""
Write-Host "Testing AWS connection..." -ForegroundColor Yellow
try {
    $identity = aws sts get-caller-identity --output json 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  -> SUCCESS! Connected to AWS:" -ForegroundColor Green
        Write-Host $identity -ForegroundColor White
    } else {
        Write-Host "  -> Connection failed. Check your keys and try again." -ForegroundColor Red
        Write-Host $identity -ForegroundColor Red
    }
} catch {
    Write-Host "  -> AWS CLI not found. Run install-tools.ps1 first." -ForegroundColor Red
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  AWS Configured!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "NEXT STEP: Run  .\generate-ssh-key.ps1  to create your SSH key" -ForegroundColor Yellow
Write-Host ""
