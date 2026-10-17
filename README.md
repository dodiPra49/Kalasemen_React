# PORPROV SUMBAR 2026 - Klasemen Sementara Perolehan Medali (React JS)

Aplikasi React JS mandiri untuk menampilkan **Klasemen Sementara Perolehan Medali** secara real-time yang bersumber dari API:
`http://localhost:8090/api/v1/medals`

---

## 🚀 Fitur Unggulan

- **Real-Time Data Fetching**: Terhubung langsung ke REST API `http://localhost:8090/api/v1/medals`.
- **Auto-Refresh**: Fitur sinkronisasi otomatis tiap 15 detik dengan tombol manual refresh & status loading visual.
- **Kartu Ringkasan (KPI)**:
  - 🥇 Total Emas
  - 🥈 Total Perak
  - 🥉 Total Perunggu
  - 🏆 Total Seluruh Medali
- **Podium Kehormatan 3 Besar**: Visual podium khusus Juara 1, 2, dan 3 dengan avatar warna kontingen dan rincian medali.
- **Pencarian Instan & Filter**:
  - Filter pencarian nama daerah (Kota/Kabupaten) dan kode kontingen secara langsung.
  - Urutkan berdasarkan Peringkat Resmi, Emas Terbanyak, Total Medali, atau Alfabet (A-Z).
- **Indikator Target Emas**: Dilengkapi bar persentase capaian emas terhadap target masing-masing kontingen.
- **Desain Modern & Responsif**: Tampilan bertema olahraga profesional, gelap (dark mode), bersih, dan adaptif untuk smartphone, tablet, maupun layar desktop.

---

## 🛠️ Cara Menjalankan

1. Masuk ke folder `HASIL-REACT`:
   ```bash
   cd HASIL-REACT
   ```

2. Jika perlu menginstal dependensi:
   ```bash
   npm install --legacy-peer-deps
   ```

3. Jalankan development server:
   ```bash
   npm run dev
   ```

4. Buka di browser Anda pada alamat yang ditampilkan (biasanya `http://localhost:5173`).

---

## 🔗 Endpoint Terhubung

- **API Medals**: `http://localhost:8090/api/v1/medals`
- Pastikan container backend Porprov (`porprov_proxy` dan `porprov_api`) sedang aktif di Docker.
