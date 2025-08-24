# CSP DUPLICATE HEADER ISSUE - CRITICAL

## Problem Identified
Server mengembalikan 2 CSP headers yang berbeda:

1. **CSP Header 1** (Benar): `default-src 'self' 'unsafe-eval' http: https: data: blob: 'unsafe-inline'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https: data: blob:...`
2. **CSP Header 2** (Salah): `default-src 'self' http: https: data: blob: 'unsafe-inline'`

## Root Cause
Browser menggunakan CSP yang **LEBIH RESTRICTIVE** ketika ada multiple CSP headers. CSP kedua tidak memiliki 'unsafe-eval' sehingga WebAssembly gagal.

## Solution Required
HAPUS CSP DUPLICATE - pastikan hanya 1 CSP header yang di-set.

### Kemungkinan Sumber CSP Duplicate:
1. **next.config.ts headers()** - mengatur CSP
2. **middleware.ts** - juga mengatur CSP  
3. **Nginx/Proxy** - mungkin menambah CSP header

### Action Plan:
1. HAPUS CSP dari next.config.ts headers() function
2. BIARKAN hanya middleware.ts yang mengatur CSP
3. Rebuild dan redeploy
4. Verifikasi hanya 1 CSP header

## Browser CSP Behavior
Ketika ada multiple CSP headers, browser menggunakan **intersection** (policy paling restrictive).