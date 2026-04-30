# Download Electron binary - attempt 2
$ErrorActionPreference = "Stop"

# Disable SSL verification for Invoke-WebRequest
add-type @"
using System.Net;
using System.Security.Cryptography.X509Certificates;
public class TrustAllCertsPolicy : ICertificatePolicy {
    public bool CheckValidationResult(
        ServicePoint srvPoint, X509Certificate certificate,
        WebRequest request, int certificateProblem) {
        return true;
    }
}
"@
[System.Net.ServicePointManager]::CertificatePolicy = New-Object TrustAllCertsPolicy

$electronDir = "D:\VNForge\node_modules\electron"
$distDir = Join-Path $electronDir "dist"

if (-not (Test-Path $distDir)) {
    New-Item -ItemType Directory -Path $distDir -Force | Out-Null
}

# Try official GitHub first
$urls = @(
    "https://github.com/electron/electron/releases/download/v33.3.1/electron-v33.3.1-win32-x64.zip",
    "https://npmmirror.com/mirrors/electron/v33.3.1/electron-v33.3.1-win32-x64.zip",
    "https://cdn.npm.taobao.org/dist/electron/v33.3.1/electron-v33.3.1-win32-x64.zip"
)

$zipPath = "$env:TEMP\electron-v33.3.1.zip"

foreach ($url in $urls) {
    Write-Host "Trying: $url"
    try {
        Invoke-WebRequest -Uri $url -OutFile $zipPath -UseBasicParsing -TimeoutSec 120
        Write-Host "Download successful from: $url"
        Write-Host "Extracting..."
        Expand-Archive -Path $zipPath -DestinationPath $distDir -Force
        Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
        Write-Host "Success!"
        Get-ChildItem $distDir | Select-Object Name, Length
        exit 0
    } catch {
        Write-Host "Failed: $($_.Exception.Message)"
        if (Test-Path $zipPath) { Remove-Item $zipPath -Force -ErrorAction SilentlyContinue }
    }
}

Write-Host "All mirrors failed."
exit 1
