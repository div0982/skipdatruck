# 🏠 Local Development Setup Script
# This script restores SQLite configuration for local development

Write-Host "🔄 Restoring local SQLite configuration..." -ForegroundColor Cyan

# Check if backup exists
if (-not (Test-Path "prisma\schema.backup.prisma")) {
    Write-Host "⚠️  No backup found, using default SQLite schema" -ForegroundColor Yellow
    
    # Restore original SQLite schema
    $sqliteSchema = Get-Content "prisma\schema.prisma"
    $sqliteSchema = $sqliteSchema -replace 'provider = "postgresql"', 'provider = "sqlite"'
    $sqliteSchema | Set-Content "prisma\schema.prisma"
} else {
    Copy-Item "prisma\schema.backup.prisma" "prisma\schema.prisma" -Force
}

# Update .env to use SQLite
Write-Host "📝 Updating .env for local development..." -ForegroundColor Cyan
Write-Host "⚠️  Please copy env.template to .env and fill in your API keys" -ForegroundColor Yellow
Write-Host ""

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env from template..." -ForegroundColor Cyan
    Copy-Item "env.template" ".env" -Force
    
    # Update DATABASE_URL to SQLite
    $envContent = Get-Content ".env"
    $envContent = $envContent -replace 'DATABASE_URL="postgresql://.*"', 'DATABASE_URL="file:./dev.db"'
    $envContent | Set-Content ".env"
}

# Generate Prisma Client
Write-Host "⚙️  Generating Prisma Client..." -ForegroundColor Cyan
npx prisma generate

# Push schema
Write-Host "📤 Pushing schema to SQLite database..." -ForegroundColor Cyan
npx prisma db push

Write-Host ""
Write-Host "✅ Local development environment restored!" -ForegroundColor Green
Write-Host ""
Write-Host "Run: npm run dev" -ForegroundColor Cyan
