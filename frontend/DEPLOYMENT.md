# Panduan Deployment Frontend

## Node.js Version Requirement

Project ini memerlukan **Node.js versi 16-20** (tidak kompatibel dengan Node.js 24+).

### Cara Menggunakan Node.js yang Tepat:

#### Untuk Deployment (Vercel/Netlify):
Tambahkan environment variable atau config:
- Vercel: Set Node.js version di dashboard atau tambahkan di vercel.json
- Netlify: Tambahkan di netlify.toml atau environment settings

#### Untuk Development Lokal:

**Option 1: Menggunakan NVM (Node Version Manager)**
```bash
# Install NVM jika belum ada
# Windows: https://github.com/coreybutler/nvm-windows
# Linux/Mac: https://github.com/nvm-sh/nvm

# Gunakan Node.js 18
nvm install 18
nvm use 18

# Verify
node --version  # Should show v18.x.x
```

**Option 2: Install Node.js 18 Langsung**
Download dan install Node.js 18 LTS dari https://nodejs.org/

### Install Dependencies

```bash
cd frontend
npm install --legacy-peer-deps
```

### Build Project

```bash
npm run build
```

### Mengatasi Deprecation Warnings

Warning-warning yang muncul saat `npm install` adalah **normal** dan **tidak menghentikan aplikasi**. Ini karena `react-scripts 5.0.1` menggunakan beberapa dependency lama.

File `.npmrc` sudah dikonfigurasi untuk mengurangi output warning saat deployment.

## Troubleshooting

### Error: "Cannot find module 'ajv/dist/compile/codegen'"
- **Penyebab**: Node.js version terlalu baru (24+)
- **Solusi**: Gunakan Node.js 16-20

### Deprecation Warnings Saat npm install
- **Status**: Normal, bukan error
- **Impact**: Tidak mempengaruhi functionality
- **Solusi**: Bisa diabaikan atau gunakan `--loglevel=error` flag
