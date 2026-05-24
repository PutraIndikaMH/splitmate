"""
Smoke test - simulasi UX nyata:
- amount_idr = 0 (user ketik deskripsi SEBELUM isi amount, persis behavior modal)
- 100 deskripsi Indonesia harian
"""
import requests

BASE = "http://localhost:8000"
THRESHOLD = 0.4

SAMPLES = [
    # Makanan (35)
    ("nasi padang", "makanan"),
    ("makan siang warteg", "makanan"),
    ("kopi susu kekinian", "makanan"),
    ("indomie goreng", "makanan"),
    ("ayam geprek es teh", "makanan"),
    ("bakso malang", "makanan"),
    ("mie ayam", "makanan"),
    ("gofood nasi goreng", "makanan"),
    ("grabfood pizza", "makanan"),
    ("sarapan bubur ayam", "makanan"),
    ("soto betawi", "makanan"),
    ("martabak manis", "makanan"),
    ("es krim", "makanan"),
    ("jus buah", "makanan"),
    ("gorengan sore", "makanan"),
    ("makan malam restoran", "makanan"),
    ("snack kantor", "makanan"),
    ("bubble tea", "makanan"),
    ("bahan masak di pasar", "makanan"),
    ("delivery sushi", "makanan"),
    ("nasi box meeting", "makanan"),
    ("kue ulang tahun", "makanan"),
    ("cemilan alfamart", "makanan"),
    ("pecel lele", "makanan"),
    ("makan bareng keluarga", "makanan"),
    ("sarapan roti bakar", "makanan"),
    ("kopi starling", "makanan"),
    ("sate", "makanan"),
    ("teh tarik", "makanan"),
    ("air galon", "makanan"),
    ("makan di food court", "makanan"),
    ("beli beras", "makanan"),
    ("sayur dan lauk", "makanan"),
    ("snack anak", "makanan"),
    ("soto ayam", "makanan"),
    # Transportasi (15)
    ("grab car ke kantor", "transportasi"),
    ("gojek ojol", "transportasi"),
    ("bensin motor", "transportasi"),
    ("bensin mobil pertamax", "transportasi"),
    ("tiket commuter line", "transportasi"),
    ("parkir mall", "transportasi"),
    ("tol cipali", "transportasi"),
    ("servis motor", "transportasi"),
    ("ganti oli mesin", "transportasi"),
    ("bus transjakarta", "transportasi"),
    ("taksi bandara", "transportasi"),
    ("angkot", "transportasi"),
    ("ferry penyeberangan", "transportasi"),
    ("grab motor pulang malam", "transportasi"),
    ("isi token parkir", "transportasi"),
    # Tagihan (12)
    ("bayar listrik PLN", "tagihan"),
    ("tagihan air PDAM", "tagihan"),
    ("bayar wifi indihome", "tagihan"),
    ("pulsa Telkomsel", "tagihan"),
    ("paket data XL", "tagihan"),
    ("bayar BPJS kesehatan", "tagihan"),
    ("cicilan KPR", "tagihan"),
    ("iuran RT", "tagihan"),
    ("langganan Netflix", "tagihan"),
    ("Spotify premium", "tagihan"),
    ("bayar PBB", "tagihan"),
    ("cicilan handphone", "tagihan"),
    # Belanja (10)
    ("beli baju kerja", "belanja"),
    ("sepatu olahraga", "belanja"),
    ("skincare moisturizer", "belanja"),
    ("belanja shopee", "belanja"),
    ("alat tulis kantor", "belanja"),
    ("deterjen dan sabun", "belanja"),
    ("beli charger hp", "belanja"),
    ("beli tas ransel", "belanja"),
    ("beli lipstik", "belanja"),
    ("grocery indomaret", "belanja"),
    # Hiburan (8)
    ("nonton bioskop", "hiburan"),
    ("karaoke bareng teman", "hiburan"),
    ("steam game", "hiburan"),
    ("konser musik", "hiburan"),
    ("main futsal", "hiburan"),
    ("langganan disney plus", "hiburan"),
    ("main bowling", "hiburan"),
    ("tiket dufan", "hiburan"),
    # Kesehatan (6)
    ("beli obat di apotek", "kesehatan"),
    ("konsultasi dokter", "kesehatan"),
    ("beli vitamin C", "kesehatan"),
    ("cek darah laboratorium", "kesehatan"),
    ("beli masker medis", "kesehatan"),
    ("gym membership", "kesehatan"),
    # Akomodasi / Tempat tinggal (5)
    ("bayar kost bulanan", "tempat_tinggal"),
    ("bayar sewa kontrakan", "tempat_tinggal"),
    ("hotel staycation", "akomodasi"),
    ("booking airbnb", "akomodasi"),
    ("uang muka kos", "tempat_tinggal"),
    # Travel (5)
    ("tiket pesawat Bali", "travel"),
    ("tiket kereta Surabaya", "travel"),
    ("visa luar negeri", "travel"),
    ("asuransi perjalanan", "travel"),
    ("tour paket wisata", "travel"),
    # Lainnya (4)
    ("transfer ke teman", "lainnya"),
    ("beli pulsa listrik", "tagihan"),
    ("sedekah masjid", "lainnya"),
    ("jajan anak sekolah", "makanan"),
]

assert len(SAMPLES) == 100, f"Got {len(SAMPLES)}"


def run():
    session = requests.Session()
    r = session.post(f"{BASE}/auth/login", json={"email": "putraaa@test.com", "password": "12345678"})
    print(f"Login: {r.status_code}")
    if r.status_code != 200:
        print(r.text)
        return

    results = []
    for notes, expected in SAMPLES:
        # amount_idr=0 persis seperti user ketik deskripsi sebelum isi jumlah
        payload = {"notes": notes, "amount_idr": 0.0, "top_k": 3}
        try:
            resp = session.post(f"{BASE}/ai/classify", json=payload, timeout=20)
            if resp.status_code != 200:
                results.append((notes, expected, None, 0.0, f"HTTP{resp.status_code}", []))
                continue
            d = resp.json()
            pred = d["predicted_category"]
            conf = d["confidence"]
            top3 = [f"{p['category']}({p['probability']:.2f})" for p in d["top_predictions"]]
            status = "PASS" if conf >= THRESHOLD else "FAIL"
            results.append((notes, expected, pred, conf, status, top3))
        except Exception as e:
            results.append((notes, expected, None, 0.0, "ERR", [str(e)[:80]]))

    ok = [r for r in results if r[4] == "PASS"]
    fail = [r for r in results if r[4] == "FAIL"]
    errors = [r for r in results if r[4] not in ("PASS", "FAIL")]
    correct = [r for r in ok if r[2] == r[1]]
    wrong = [r for r in ok if r[2] != r[1]]

    print()
    print("=" * 65)
    print("  SIMULASI UX NYATA  (amount_idr=0, user ketik dulu baru isi Rp)")
    print("=" * 65)
    print(f"  TOTAL              : 100")
    print(f"  LULUS  (>= 0.4)    : {len(ok)}")
    print(f"  GAGAL  (< 0.4)     : {len(fail)}  <- tidak muncul di UI sama sekali")
    print(f"  ERROR              : {len(errors)}")
    print(f"  BENAR dari yg lulus: {len(correct)} / {len(ok)}")
    print(f"  SALAH dari yg lulus: {len(wrong)} / {len(ok)}")
    print(f"  EFEKTIF (benar/100): {len(correct)}%")
    print("=" * 65)

    print("\n-- PER-KATEGORI --")
    cats = {}
    for notes, exp, pred, conf, status, _ in results:
        if exp not in cats:
            cats[exp] = {"total": 0, "pass": 0, "correct": 0}
        cats[exp]["total"] += 1
        if status == "PASS":
            cats[exp]["pass"] += 1
            if pred == exp:
                cats[exp]["correct"] += 1
    for cat, v in sorted(cats.items()):
        rate = v["pass"] / v["total"] * 100
        bar = "#" * int(rate / 10) + "." * (10 - int(rate / 10))
        print(f"  {cat:20s} [{bar}] {v['pass']}/{v['total']} lulus, {v['correct']} benar ({rate:.0f}%)")

    print("\n-- LULUS TAPI SALAH KATEGORI (misleading buat user) --")
    for r in wrong:
        print(f"  [{r[3]:.2f}] \"{r[0]}\" -> AI:{r[2]} | harusnya:{r[1]}")

    print("\n-- GAGAL THRESHOLD (tidak tampil di UI) --")
    for r in sorted(fail, key=lambda x: x[3], reverse=True):
        print(f"  [{r[3]:.2f}] \"{r[0]}\" -> {r[2]} | harusnya:{r[1]}")

    print("\n-- ERRORS --")
    for r in errors:
        print(f"  {r[4]} -- \"{r[0]}\" | {r[5]}")


if __name__ == "__main__":
    run()
