# 🚀 Production Deployment Script
# This script prepares your database for Vercel deployment

Write-Host "🔄 Setting up PostgreSQL schema for production..." -ForegroundColor Cyan

# Check if DATABASE_URL is set
if (-not $env:DATABASE_URL) {
    Write-Host "❌ ERROR: DATABASE_URL environment variable not set!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please set your Supabase DATABASE_URL:" -ForegroundColor Yellow
    Write-Host '  $env:DATABASE_URL="postgresql://postgres:PASSWORD@db.XXX.supabase.co:5432/postgres"' -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

if ($env:DATABASE_URL -match "file:") {
    Write-Host "❌ ERROR: DATABASE_URL is still using SQLite!" -ForegroundColor Red
    Write-Host "Please set your Supabase PostgreSQL URL" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ DATABASE_URL is configured" -ForegroundColor Green

# Backup current schema
Write-Host "📋 Backing up current schema..." -ForegroundColor Cyan
Copy-Item "prisma\schema.prisma" "prisma\schema.backup.prisma" -Force

# Use production schema
Write-Host "🔄 Switching to PostgreSQL schema..." -ForegroundColor Cyan
Copy-Item "prisma\schema.production.prisma" "prisma\schema.prisma" -Force

# Generate Prisma Client
Write-Host "⚙️  Generating Prisma Client..." -ForegroundColor Cyan
npx prisma generate

# Push schema to database
Write-Host "📤 Pushing schema to PostgreSQL database..." -ForegroundColor Cyan
npx prisma db push

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Production database setup complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Test the connection: npm run dev" -ForegroundColor White
    Write-Host "  2. Seed the database: npx prisma db seed" -ForegroundColor White
    Write-Host "  3. Push to GitHub and deploy on Vercel" -ForegroundColor White
    Write-Host ""
    Write-Host "To restore SQLite for local dev, run: .\setup-local.ps1" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "❌ Failed to push schema to database" -ForegroundColor Red
    Write-Host "Restoring original schema..." -ForegroundColor Yellow
    Copy-Item "prisma\schema.backup.prisma" "prisma\schema.prisma" -Force
    exit 1
}
