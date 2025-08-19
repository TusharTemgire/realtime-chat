Write-Host "🚀 Starting Realtime Chat Application..." -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js and try again." -ForegroundColor Red
    exit 1
}

Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow

# Install root dependencies
if (!(Test-Path "node_modules")) {
    Write-Host "Installing root dependencies..." -ForegroundColor Cyan
    npm install
}

# Install server dependencies
if (!(Test-Path "server/node_modules")) {
    Write-Host "Installing server dependencies..." -ForegroundColor Cyan
    Set-Location server
    npm install
    Set-Location ..
}

# Install web dependencies
if (!(Test-Path "web/node_modules")) {
    Write-Host "Installing web dependencies..." -ForegroundColor Cyan
    Set-Location web
    npm install
    Set-Location ..
}

Write-Host "✅ Dependencies installed successfully!" -ForegroundColor Green

# Sync database
Write-Host "🗄️ Syncing database..." -ForegroundColor Yellow
Set-Location server
npm run sync
Set-Location ..

Write-Host "🎉 Setup complete! Starting development servers..." -ForegroundColor Green
Write-Host ""
Write-Host "Backend will be available at: http://localhost:4000" -ForegroundColor Cyan
Write-Host "Frontend will be available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop all servers" -ForegroundColor Yellow

# Start both servers
npm run dev
