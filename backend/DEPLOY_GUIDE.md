# 🚀 Deploy Backend ke Vercel

## 📋 Checklist Sebelum Deploy

- [x] ✅ `vercel.json` sudah dibuat
- [x] ✅ `server.js` sudah diupdate untuk serverless
- [x] ✅ `package.json` sudah ada engines Node 18.x
- [x] ✅ `.vercelignore` sudah dibuat
- [x] ✅ `.gitignore` sudah include .vercel
- [x] ✅ Database connection menggunakan cached connection

## 🌐 Langkah Deploy

### 1. Push ke GitHub

```bash
git add .
git commit -m "Setup backend for Vercel deployment"
git push origin main
```

### 2. Import di Vercel

1. Masuk ke https://vercel.com
2. Klik **"Add New" → Project**
3. **Import Git Repository** → Pilih repo backend Anda
4. **Configure Project:**
   - Project Name: `peluang-backend`
   - Framework Preset: `Other`
   - Root Directory: `backend` (atau `.` jika sudah di root)
   - Build Command: (kosongkan)
   - Output Directory: `.`
   - Install Command: `npm install`

### 3. Environment Variables

Klik **"Add"** dan masukkan:

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/peluang
JWT_SECRET=your-super-secret-key-min-32-karakter
JWT_EXPIRE=7d
FRONTEND_URL=https://your-frontend.vercel.app
SESSION_SECRET=your-session-secret-key
```

### 4. Deploy!

Klik **"Deploy"** dan tunggu prosesnya selesai.

### 5. Test Deployment

Setelah deploy selesai, test endpoint:

```bash
# Health check
curl https://your-backend.vercel.app/health

# Expected response:
{
  "status": "OK",
  "database": "Connected",
  "timestamp": "2026-01-20T..."
}
```

## 🔧 Vercel Dashboard Settings (Jika Manual)

Jika Vercel tidak auto-detect, isi manual:

```
Framework: Other
Build Command: (kosongkan atau echo "No build")
Output Directory: .
Install Command: npm install
Development Command: npm run dev
Node.js Version: 18.x
```

## 🐛 Troubleshooting

### Error: Module not found
- Pastikan semua dependencies ada di `package.json`
- Di Vercel Settings → General → Node.js Version: 18.x

### CORS Error
- Pastikan `FRONTEND_URL` sudah diset di environment variables
- Cek CORS config di `server.js`

### MongoDB Connection Timeout
- Whitelist IP `0.0.0.0/0` di MongoDB Atlas
- Pastikan `MONGODB_URI` benar

### 404 di Routes
- Pastikan semua routes files ada
- Cek `vercel.json` routing config

## 📝 Perubahan yang Dilakukan

1. ✅ `server.js` - Cached MongoDB connection
2. ✅ `server.js` - Export `module.exports = app`
3. ✅ `server.js` - Conditional server start (hanya dev)
4. ✅ `package.json` - Tambah engines & scripts
5. ✅ `vercel.json` - Config Vercel
6. ✅ `.vercelignore` - Files to ignore
7. ✅ `.gitignore` - Tambah .vercel folder

## 🎉 Selesai!

Backend Anda siap di-deploy ke Vercel!

URL Backend: `https://your-project-name.vercel.app`
