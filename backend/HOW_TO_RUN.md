# Cara Menjalankan Backend SplitMate

## Prasyarat
- Python 3.12 (direkomendasikan untuk stack AI)
- Virtual environment sudah dibuat

---

## Pertama Kali (One-time Setup)

```bash
# 1. Masuk ke folder backend
cd backend

# 2. (Windows) Cek path Python 3.12
where python

# 3. Buat virtual environment dengan Python 3.12
# Gunakan path Python 3.12 secara eksplisit jika default python kamu bukan 3.12:
# "C:\Users\User\AppData\Local\Programs\Python\Python312\python.exe" -m venv venv312
python -m venv venv312

# 4. Aktifkan virtual environment (Windows)
venv312\Scripts\activate

# 5. Install semua dependency (core + AI)
pip install -r requirements.txt
```

---

## Setiap Kali Mau Jalankan

```bash
# 1. Masuk ke folder backend
cd backend

# 2. Aktifkan virtual environment (Windows)
venv312\Scripts\activate

# 3. Jalankan server
uvicorn app.main:app --reload
```

Server berjalan di **http://localhost:8000**

---

## URL Penting

| URL | Keterangan |
|-----|------------|
| http://localhost:8000 | Root - cek API running |
| http://localhost:8000/health | Health check |
| http://localhost:8000/ai/health | Health check modul AI |
| http://localhost:8000/ai/predict | Prediksi pengeluaran (POST) |
| http://localhost:8000/ai/classify | Klasifikasi transaksi (POST) |
| http://localhost:8000/docs | Swagger UI - testing API interaktif |
| http://localhost:8000/redoc | ReDoc - dokumentasi API alternatif |

---

## Verifikasi AI Cepat

1. Login dulu lewat endpoint auth agar cookie sesi aktif.
2. Buka `http://localhost:8000/docs`.
3. Uji endpoint:
   - `GET /ai/health` -> semua artifact harus `true`.
   - `POST /ai/classify` dengan payload contoh.
   - `POST /ai/predict` dengan `rows` minimal 10.

Jika dependency AI belum terpasang, endpoint AI akan gagal dipakai.

Smoke test minimal dari terminal:

```bash
cd backend
venv\Scripts\activate
python -c "import app.main; print('APP_IMPORT_OK')"
```

---

## Standar Team (Disarankan)

Gunakan lock file agar environment reproducible:

```bash
# Setelah dependency berhasil terpasang
pip freeze > requirements-lock-py312.txt

# Di mesin lain
pip install -r requirements-lock-py312.txt
```

---

## Matikan Server

Tekan `Ctrl + C` di terminal.

---

## Matikan Virtual Environment

```bash
deactivate
```
