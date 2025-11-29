# QR Food Truck Platform - Quick Setup Script

Write-Host "🍽️  QR Food Truck Ordering Platform - Setup" -ForegroundColor Cyan
Write-Host "=========================================`n" -ForegroundColor Cyan

# Check if .env file exists
if (!(Test-Path ".env")) {
    Write-Host "⚙️  Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item "env.template" ".env"
    Write-Host "✓ Created .env file" -ForegroundColor Green
    Write-Host "`n⚠️  IMPORTANT: Edit .env file and add your credentials!" -ForegroundColor Red
    Write-Host "   - DATABASE_URL (PostgreSQL connection string)" -ForegroundColor Yellow
    Write-Host "   - STRIPE_SECRET_KEY" -ForegroundColor Yellow
    Write-Host "   - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" -ForegroundColor Yellow
    Write-Host "   - STRIPE_WEBHOOK_SECRET`n" -ForegroundColor Yellow
} else {
    Write-Host "✓ .env file exists" -ForegroundColor Green
}

# Install dependencies
Write-Host "`n📦 Installing dependencies..." -ForegroundColor Cyan
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Push database schema
Write-Host "`n🗄️  Setting up database..." -ForegroundColor Cyan
Write-Host "   Running: npx prisma db push" -ForegroundColor Gray
npx prisma db push --skip-generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Database schema created" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to create database schema" -ForegroundColor Red
    Write-Host "   Make sure your DATABASE_URL in .env is correct" -ForegroundColor Yellow
    exit 1
}

# Generate Prisma client
Write-Host "`n🔧 Generating Prisma client..." -ForegroundColor Cyan
npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Prisma client generated" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to generate Prisma client" -ForegroundColor Red
    exit 1
}

# Seed database
Write-Host "`n🌱 Seeding database with demo data..." -ForegroundColor Cyan
npm run db:seed

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Database seeded successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to seed database" -ForegroundColor Red
    exit 1
}

# Success message
Write-Host "`n✨ Setup complete!" -ForegroundColor Green
Write-Host "=========================================`n" -ForegroundColor Cyan

Write-Host "🚀 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Verify your .env file has correct credentials" -ForegroundColor White
Write-Host "   2. Run: npm run dev" -ForegroundColor White
Write-Host "   3. Visit: http://localhost:3000`n" -ForegroundColor White

Write-Host "📱 Demo URLs:" -ForegroundColor Cyan
Write-Host "   Customer: http://localhost:3000/t/demo-truck-1" -ForegroundColor White
Write-Host "   Merchant: http://localhost:3000/dashboard/merchant?truckId=demo-truck-1" -ForegroundColor White
Write-Host "   Admin:    http://localhost:3000/dashboard/admin`n" -ForegroundColor White

Write-Host "💳 Test Stripe Card:" -ForegroundColor Cyan
Write-Host "   4242 4242 4242 4242 (any future date, any CVC)`n" -ForegroundColor White
