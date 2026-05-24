# Cara Menjalankan SplitMate

SplitMate terdiri dari dua bagian: **Backend** (FastAPI) dan **Frontend** (React + Vite). Keduanya harus dijalankan bersamaan.

---

## Prasyarat

- Python 3.10+
- Node.js 18+
- npm

---

## 1. Setup Backend

### Pertama Kali (One-time Setup)

```bash
# Masuk ke folder backend
cd backend

# Buat virtual environment
python -m venv venv

# Aktifkan virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Buat File `.env`

Buat file `backend/.env` dengan isi berikut (sesuaikan nilainya):

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

DATABASE_URL=postgresql://user:password@host:5432/postgres

JWT_SECRET_KEY=your_random_secret_key
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440
COOKIE_SECURE=False
```

> `COOKIE_SECURE=False` untuk development lokal. Ganti ke `True` saat production (HTTPS).

### Jalankan Backend

```bash
cd backend

# Aktifkan virtual environment
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux

# Jalankan server
uvicorn app.main:app --reload
```

Backend berjalan di **http://localhost:8000**

| URL | Keterangan |
|-----|------------|
| http://localhost:8000/docs | Swagger UI - testing API interaktif |
| http://localhost:8000/health | Health check |
| http://localhost:8000/ai/health | Health check modul AI |
| http://localhost:8000/ai/classify | Klasifikasi transaksi (POST) |
| http://localhost:8000/ai/predict | Prediksi pengeluaran (POST) |

---

## 2. Setup Frontend

### Pertama Kali (One-time Setup)

```bash
# Masuk ke folder frontend
cd frontend

# Install dependencies
npm install
```

### Buat File `.env`

Buat file `frontend/.env` dengan isi berikut:

```env
VITE_API_URL=http://localhost:8000
```

### Jalankan Frontend

```bash
cd frontend

npm run dev
```

Frontend berjalan di **http://localhost:5173**

---

## 3. Menjalankan Keduanya Sekaligus

Buka **dua terminal terpisah**:

**Terminal 1 - Backend:**
```bash
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Lalu buka browser ke **http://localhost:5173**

---

## Menghentikan Server

Tekan `Ctrl + C` di masing-masing terminal.
