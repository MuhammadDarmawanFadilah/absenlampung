#!/bin/bash

# EMERGENCY CSP FIX DEPLOYMENT - WebAssembly Support
# Script untuk deploy CSP fix dengan prioritas tinggi

set -e

echo "🚨 EMERGENCY CSP FIX DEPLOYMENT FOR WEBASSEMBLY"
echo "=============================================="

# Check if we're on the server
if [ ! -f "/tmp/absenkantor-deploy/.git/config" ]; then
    echo "❌ This script must be run on the production server!"
    echo "📋 Run these commands on your server:"
    echo ""
    echo "ssh root@absenkantor.my.id"
    echo "curl -sSL https://raw.githubusercontent.com/MuhammadDarmawanFadilah/absenlampung/main/emergency-csp-deploy.sh | bash"
    exit 1
fi

echo "🔍 Checking current deployment..."

# Go to deploy directory
cd /tmp/absenkantor-deploy

# Pull latest changes with CSP fix
echo "📥 Pulling latest changes with CSP fix..."
git fetch --all
git reset --hard origin/main
git pull origin main

# Verify CSP fix exists
echo "🔍 Verifying CSP fixes..."

# Check middleware
if grep -q "default-src 'self' 'unsafe-eval'" frontend/src/middleware.ts; then
    echo "✅ Middleware CSP fix found"
else
    echo "❌ Middleware CSP fix NOT found!"
    exit 1
fi

# Check next.config.ts
if grep -q "default-src 'self' 'unsafe-eval'" frontend/next.config.ts; then
    echo "✅ Next.js config CSP fix found"
else
    echo "❌ Next.js config CSP fix NOT found!"
    exit 1
fi

# Go to frontend
cd frontend

# Setup environment
echo "⚙️ Setting up environment..."
if [ -f ".env.prod" ]; then
    cp .env.prod .env.local
    cp .env.prod .env
    echo "✅ Environment configured (.env.prod)"
else
    echo "❌ .env.prod not found!"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

# Build with CSP fix
echo "🔨 Building with CSP fix..."
rm -rf .next
pnpm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful with CSP fix"

# Deploy to production
echo "🚀 Deploying to production..."
mkdir -p /var/www/absenkantor.my.id
cp -r .next public package.json next.config.ts .env /var/www/absenkantor.my.id/

# Copy middleware specifically
mkdir -p /var/www/absenkantor.my.id/src
cp -r src/middleware.ts /var/www/absenkantor.my.id/src/

# Set permissions
chown -R root:root /var/www/absenkantor.my.id
chmod -R 755 /var/www/absenkantor.my.id

echo "✅ Files deployed"

# Restart service
echo "🔄 Restarting frontend service..."
systemctl stop absenkantor-frontend
sleep 2
systemctl start absenkantor-frontend
systemctl enable absenkantor-frontend

# Wait for service to start
echo "⏳ Waiting for service to start..."
sleep 5

# Check service status
if systemctl is-active --quiet absenkantor-frontend; then
    echo "✅ Frontend service running"
else
    echo "❌ Frontend service failed to start"
    echo "📋 Service status:"
    systemctl status absenkantor-frontend --no-pager
    exit 1
fi

# Test Nginx config and reload
echo "🔄 Testing and reloading Nginx..."
if nginx -t; then
    systemctl reload nginx
    echo "✅ Nginx reloaded"
else
    echo "❌ Nginx config test failed"
    nginx -t
    exit 1
fi

# Verify deployment
echo "🔍 Verifying CSP headers in production..."
sleep 3

# Test CSP headers
CSP_HEADER=$(curl -s -I https://absenkantor.my.id | grep -i "content-security-policy" | head -1)
echo "🔒 Current CSP: $CSP_HEADER"

if echo "$CSP_HEADER" | grep -q "unsafe-eval"; then
    echo "✅ CSP contains 'unsafe-eval' - WebAssembly should work!"
else
    echo "⚠️ CSP might not contain 'unsafe-eval'"
    echo "🔍 Full headers:"
    curl -s -I https://absenkantor.my.id
fi

# Test face recognition page
echo "🧠 Testing face recognition page..."
if curl -s -I "https://absenkantor.my.id/admin/master-data/face-recognition/create?pegawaiId=1" | grep -q "200 OK"; then
    echo "✅ Face recognition page accessible"
else
    echo "⚠️ Face recognition page might have issues"
fi

# Test WASM test page
echo "🔬 Testing WebAssembly test page..."
if curl -s -I "https://absenkantor.my.id/test-wasm-csp.html" | grep -q "200 OK"; then
    echo "✅ WASM test page accessible"
else
    echo "⚠️ WASM test page not found"
fi

echo ""
echo "🎉 EMERGENCY CSP FIX DEPLOYMENT COMPLETED!"
echo "========================================="
echo "✅ CSP fix deployed"
echo "✅ Frontend service restarted"
echo "✅ Nginx reloaded"
echo ""
echo "🔍 VERIFICATION:"
echo "1. Visit: https://absenkantor.my.id/admin/master-data/face-recognition/create?pegawaiId=1"
echo "2. Open Browser DevTools → Console"
echo "3. Should NOT see CSP WebAssembly errors"
echo "4. Should see successful MediaPipe initialization"
echo ""
echo "🆘 If still having issues:"
echo "1. Clear browser cache completely"
echo "2. Try incognito/private browsing mode"
echo "3. Check: curl -I https://absenkantor.my.id | grep -i csp"
echo ""
echo "📞 Contact support if WebAssembly still fails after cache clear"