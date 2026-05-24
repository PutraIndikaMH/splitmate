"""
Smoke test: 100 deskripsi pengeluaran Indonesia → classify endpoint
Jalankan dari folder backend dengan venv312 aktif:
  python smoke_test_classify.py
"""

import json
import requests

BASE = "http://localhost:8000"
EMAIL = "putraaa@test.com"
PASSWORD = "12345678"
THRESHOLD = 0.4

# 100 deskripsi realistis berdasarkan perilaku belanja masyarakat Indonesia
# Sumber: BPS 2023, OJK Financial Literacy Survey, Jakpat Consumer Survey 2024
# Distribusi: Makanan 35%, Transportasi 15%, Tagihan 12%, Belanja 10%,
#             Hiburan 8%, Kesehatan 6%, Akomodasi 5%, Lainnya 9%
SAMPLES = [
    # ── Makanan (35 item) ──
    ("nasi padang", 25000, "makanan"),
    ("makan siang warteg", 15000, "makanan"),
    ("kopi susu kekinian", 28000, "makanan"),
    ("indomie goreng", 5000, "makanan"),
    ("ayam geprek + es teh", 22000, "makanan"),
    ("bakso malang", 18000, "makanan"),
    ("mie ayam", 17000, "makanan"),
    ("gofood nasi goreng", 32000, "makanan"),
    ("grabfood pizza", 85000, "makanan"),
    ("sarapan bubur ayam", 12000, "makanan"),
    ("soto betawi", 30000, "makanan"),
    ("martabak manis", 45000, "makanan"),
    ("es krim", 15000, "makanan"),
    ("jus buah", 12000, "makanan"),
    ("gorengan sore", 8000, "makanan"),
    ("makan malam restoran", 120000, "makanan"),
    ("snack kantor", 20000, "makanan"),
    ("minuman bubble tea", 35000, "makanan"),
    ("belanja bahan masak di pasar", 75000, "makanan"),
    ("delivery sushi", 150000, "makanan"),
    ("nasi box meeting", 55000, "makanan"),
    ("kue ultah teman", 180000, "makanan"),
    ("cemilan alfamart", 25000, "makanan"),
    ("pecel lele", 20000, "makanan"),
    ("makan bareng keluarga", 250000, "makanan"),
    ("sarapan roti bakar", 18000, "makanan"),
    ("kopi starling", 10000, "makanan"),
    ("sate 10 tusuk", 22000, "makanan"),
    ("teh tarik", 13000, "makanan"),
    ("beli air galon", 20000, "makanan"),
    ("makan di mal food court", 65000, "makanan"),
    ("beli beras 5kg", 60000, "makanan"),
    ("sayur dan lauk harian", 40000, "makanan"),
    ("snack anak", 15000, "makanan"),
    ("makan soto ayam", 22000, "makanan"),

    # ── Transportasi (15 item) ──
    ("grab car ke kantor", 35000, "transportasi"),
    ("gojek ojol", 18000, "transportasi"),
    ("bensin motor", 30000, "transportasi"),
    ("bensin mobil pertamax", 120000, "transportasi"),
    ("tiket commuter line", 5000, "transportasi"),
    ("parkir mall", 8000, "transportasi"),
    ("tol cipali", 62000, "transportasi"),
    ("servis motor rutin", 85000, "transportasi"),
    ("ganti oli mesin", 65000, "transportasi"),
    ("isi token parkir", 50000, "transportasi"),
    ("bus transjakarta", 3500, "transportasi"),
    ("taksi bandara", 180000, "transportasi"),
    ("angkot naik turun", 8000, "transportasi"),
    ("ferry penyeberangan", 25000, "transportasi"),
    ("grab motor pulang malam", 22000, "transportasi"),

    # ── Tagihan (12 item) ──
    ("bayar listrik PLN", 250000, "tagihan"),
    ("tagihan air PDAM", 85000, "tagihan"),
    ("bayar wifi Indihome", 330000, "tagihan"),
    ("pulsa Telkomsel", 50000, "tagihan"),
    ("paket data XL", 75000, "tagihan"),
    ("bayar BPJS kesehatan", 150000, "tagihan"),
    ("cicilan KPR bulan ini", 2500000, "tagihan"),
    ("iuran lingkungan RT", 30000, "tagihan"),
    ("langganan Netflix", 54000, "tagihan"),
    ("Spotify premium", 54990, "tagihan"),
    ("bayar PBB", 350000, "tagihan"),
    ("cicilan handphone", 600000, "tagihan"),

    # ── Belanja (10 item) ──
    ("beli baju kerja", 180000, "belanja"),
    ("sepatu olahraga", 350000, "belanja"),
    ("skincare moisturizer", 120000, "belanja"),
    ("belanja Shopee bulanan", 250000, "belanja"),
    ("beli alat tulis kantor", 45000, "belanja"),
    ("deterjen dan sabun", 65000, "belanja"),
    ("beli charger hp", 85000, "belanja"),
    ("beli tas ransel", 220000, "belanja"),
    ("beli lipstik", 95000, "belanja"),
    ("grocery indomaret", 155000, "belanja"),

    # ── Hiburan (8 item) ──
    ("nonton bioskop", 75000, "hiburan"),
    ("karaoke bareng teman", 180000, "hiburan"),
    ("steam game", 180000, "hiburan"),
    ("konser musik", 350000, "hiburan"),
    ("main futsal", 75000, "hiburan"),
    ("langganan Disney+", 39000, "hiburan"),
    ("main bowling", 55000, "hiburan"),
    ("tiket wahana dufan", 250000, "hiburan"),

    # ── Kesehatan (6 item) ──
    ("beli obat di apotek", 45000, "kesehatan"),
    ("konsultasi dokter umum", 100000, "kesehatan"),
    ("beli vitamin C", 35000, "kesehatan"),
    ("cek darah lab", 150000, "kesehatan"),
    ("beli masker medis", 25000, "kesehatan"),
    ("gym membership bulanan", 250000, "kesehatan"),

    # ── Akomodasi (5 item) ──
    ("kost bulanan", 1200000, "tempat_tinggal"),
    ("bayar sewa kontrakan", 3000000, "tempat_tinggal"),
    ("hotel staycation", 450000, "akomodasi"),
    ("booking airbnb", 350000, "akomodasi"),
    ("uang muka sewa kos", 1200000, "tempat_tinggal"),

    # ── Travel (5 item) ──
    ("tiket pesawat Bali", 750000, "travel"),
    ("tiket kereta Surabaya", 350000, "travel"),
    ("visa luar negeri", 800000, "travel"),
    ("asuransi perjalanan", 125000, "travel"),
    ("tour paket wisata", 1500000, "travel"),

    # ── Lainnya / edge cases (4 item) ──
    ("transfer ke teman", 100000, "lainnya"),
    ("beli pulsa listrik", 100000, "tagihan"),
    ("sedekah masjid", 50000, "lainnya"),
    ("jajan anak sekolah", 15000, "makanan"),
]

assert len(SAMPLES) == 100, f"Jumlah sample: {len(SAMPLES)}"


def login(session: requests.Session) -> bool:
    r = session.post(f"{BASE}/auth/login", json={"email": EMAIL, "password": PASSWORD})
    if r.status_code != 200:
        print(f"[LOGIN GAGAL] {r.status_code} — {r.text[:200]}")
        return False
    print(f"[LOGIN OK] user: {r.json()['user']['email']}\n")
    return True


def run():
    session = requests.Session()
    if not login(session):
        return

    results = []
    failed_login = 0

    for notes, amount, expected_cat in SAMPLES:
        payload = {
            "notes": notes,
            "amount_idr": float(amount),
            "top_k": 3,
        }
        try:
            r = session.post(f"{BASE}/ai/classify", json=payload, timeout=10)
            if r.status_code == 401:
                failed_login += 1
                results.append((notes, expected_cat, None, 0.0, "401"))
                continue
            if r.status_code != 200:
                results.append((notes, expected_cat, None, 0.0, str(r.status_code)))
                continue
            data = r.json()
            pred = data["predicted_category"]
            conf = data["confidence"]
            top3 = [f"{p['category']}({p['probability']:.2f})" for p in data["top_predictions"]]
            status = "OK" if conf >= THRESHOLD else "LOW_CONF"
            results.append((notes, expected_cat, pred, conf, status, top3))
        except Exception as e:
            results.append((notes, expected_cat, None, 0.0, f"ERR:{e}"))

    # ── Summary ──
    ok       = [r for r in results if len(r) >= 5 and r[4] == "OK"]
    low_conf = [r for r in results if len(r) >= 5 and r[4] == "LOW_CONF"]
    errors   = [r for r in results if len(r) >= 5 and r[4] not in ("OK", "LOW_CONF")]
    correct  = [r for r in ok if r[2] == r[1]]

    print("=" * 70)
    print(f"TOTAL SAMPLE : 100")
    print(f"[PASS] LULUS (conf >= 0.4) : {len(ok)}")
    print(f"[WARN] LOW CONF (<0.4)     : {len(low_conf)}")
    print(f"[FAIL] ERROR               : {len(errors)}")
    print(f"[HIT]  PREDIKSI BENAR      : {len(correct)} / {len(ok)} yang lulus")
    print("=" * 70)

    if low_conf:
        print("\n── LOW CONFIDENCE (gagal di frontend threshold) ──")
        for r in low_conf:
            top3_str = ", ".join(r[5]) if len(r) > 5 else "-"
            print(f"  [{r[3]:.2f}] '{r[0]}' → AI: {r[2]} | expected: {r[1]}")
            print(f"         top3: {top3_str}")

    if errors:
        print("\n── ERRORS ──")
        for r in errors:
            print(f"  {r[4]} — '{r[0]}'")

    print("\n── SALAH KATEGORI (lulus tapi prediksi beda) ──")
    wrong = [r for r in ok if r[2] != r[1]]
    for r in wrong:
        top3_str = ", ".join(r[5]) if len(r) > 5 else "-"
        print(f"  '{r[0]}' → AI: {r[2]} | expected: {r[1]} | conf: {r[3]:.2f}")
        print(f"    top3: {top3_str}")

    print("\n── PER-KATEGORI PASS RATE ──")
    cats = {}
    for notes, exp, pred, conf, status, *_ in results:
        if exp not in cats:
            cats[exp] = {"total": 0, "pass": 0}
        cats[exp]["total"] += 1
        if status == "OK":
            cats[exp]["pass"] += 1
    for cat, v in sorted(cats.items()):
        rate = v["pass"] / v["total"] * 100
        bar = "█" * int(rate / 10) + "░" * (10 - int(rate / 10))
        print(f"  {cat:20s} {bar} {v['pass']}/{v['total']} ({rate:.0f}%)")


if __name__ == "__main__":
    run()
