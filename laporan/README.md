# 📘 Laporan Final Project Teknologi Komputasi Awan

## 👥 Kelompok 1  
**Anggota:**  
- Aqila Aqsa (5027211032)  
- Tridiktya Hardani Putra (5027211049)  

---

## 📌 (1) Deskripsi Final Project

Anda adalah seorang lulusan Teknologi Informasi. Sebagai ahli IT, salah satu kemampuan yang harus dimiliki adalah kemampuan merancang, membangun, dan mengelola aplikasi berbasis komputer menggunakan layanan cloud untuk memenuhi kebutuhan organisasi.

Pada suatu saat Anda mendapatkan proyek dari departemen untuk mendeploy sebuah aplikasi **Absen berbasis Face Recognition**, dengan komponen:
- **Backend**: Python FastAPI  
- **Frontend**: ReactJS  

Spesifikasi aplikasi tersedia di repositori berikut:  
🔗 [https://github.com/fuaddary/fp-cloud-2025](https://github.com/fuaddary/fp-cloud-2025)

Anda diminta untuk mendesain arsitektur cloud yang sesuai dengan kebutuhan aplikasi tersebut.  
**Batas anggaran: 100 USD**

---

## ☁️ Lingkungan Cloud yang Dipilih

**Google Cloud Platform (GCP)**

---

## 📝 Tugas dan Penilaian

### 🔹 Arsitektur & Biaya (20%)
- Mendesain arsitektur cloud lengkap
- Menghitung dan menjelaskan estimasi harga VM dan komponen lainnya  
- Dipresentasikan pada minggu ke-15

### 🔹 Implementasi & Deployment (20%)
- Instalasi aplikasi sesuai spesifikasi arsitektur
- Pastikan semua endpoint berjalan dengan baik

### 🔹 Load Testing dengan Locust (35%)
- Fokus pada endpoint `/recognize-face` dalam mode kiosk
- Locust dijalankan dari komputer/host yang berbeda dari aplikasi
- Tujuan pengujian:
  - Menentukan jumlah maksimal pengguna tanpa error
  - Membandingkan jumlah user dengan response time

- **Jumlah user yang diuji:**
  - 1, 3, 5, 10, 15, 20, 30 user

### 🔹 Dokumentasi GitHub (25%)
1. **Introduction**  
   Penjelasan masalah dan latar belakang

2. **Desain Arsitektur Cloud**  
   - Gambar desain arsitektur (dapat menggunakan [https://app.diagrams.net/](https://app.diagrams.net/))  
   - Tabel spesifikasi VM dan estimasi biaya

3. **Langkah Implementasi dan Konfigurasi**  
   - Load balancing  
   - Instalasi `app.py`, MongoDB, dan lainnya  
   - Sertakan screenshot jika memungkinkan

4. **Pengujian API dan Antarmuka**  
   - Uji endpoint aplikasi
   - Tampilkan antarmuka aplikasi

5. **Load Testing & Analisis**  
   - Hasil uji Locust  
   - Analisis performa dan bottleneck

6. **Kesimpulan dan Saran**  
   - Evaluasi akhir proyek  
   - Rekomendasi perbaikan atau optimasi

---

## (2) 📐 Rancangan Arsitektur Cloud

**Diagram Arsitektur:**
![Cloud Architecture Diagram](assets/architecture-diagram.jpeg)

---

## 💰 Tabel Perkiraan Biaya Bulanan

| **Komponen**                            | **Jumlah / Unit** | **Harga per Unit (per bulan)** | **Total Bulanan** |
|----------------------------------------|-------------------|-------------------------------|-------------------|
| Compute Engine (e2-small, 2 vCPU, 2GB) | 1 VM (Load Balancer) | $13.93                        | $13.93            |
| Compute Engine (e2-small, 2 vCPU, 2GB) | 1 VM (Worker 1)       | $20.73                        | $20.73            |
| Compute Engine (e2-small, 2 vCPU, 2GB) | 1 VM (Worker 2)       | $20.73                        | $20.73            |
| Compute Engine (e2-small, 2 vCPU, 2GB) | 1 VM (Worker 3)       | $20.73                        | $20.73            |
| **Total**                              |                     |                               | **$76.12**        |

---

## 4. Pengujian API dan Antarmuka

### 🔹 Uji Endpoint Aplikasi

Semua endpoint diuji menggunakan Swagger UI (`/docs`) dan Thunder Client Extension melalui Visual Studio Code.

> 📸 **Swagger UI - Dokumentasi API**  
> ![Swagger Screenshot](assets/swagger-endpoints.png)

> 📸 **Postman - Uji Register Face**  
> ![Postman Register Face](assets/postman-register-face.png)

| Endpoint | Method | Deskripsi | Status |
|----------|--------|-----------|--------|
| `/admin/login` | POST | Login admin | ✅ |
| `/admin/` | POST | Tambah admin baru | ✅ |
| `/employee/` | POST | Tambah karyawan | ✅ |
| `/employee/` | GET | Ambil semua karyawan | ✅ |
| `/employee/{id}` | GET | Detail karyawan | ✅ |
| `/employee/{id}` | PUT | Update karyawan | ✅ |
| `/employee/{id}` | DELETE | Hapus karyawan | ✅ |
| `/face/register` | POST | Upload wajah (register) | ✅ |
| `/face/recognize` | POST | Deteksi wajah (kiosk) | ✅ |
| `/attendance/checkin` | POST | Absen masuk | ✅ |
| `/attendance/checkout` | POST | Absen keluar | ✅ |
| `/attendance` | GET | Semua data absen | ✅ |
| `/attendance/{employee_id}` | GET | Riwayat per karyawan | ✅ |

---

### 🔹 Tampilkan Antarmuka Aplikasi

Berikut hasil tangkapan layar (screenshot) antarmuka frontend aplikasi saat digunakan.

> 📸 **1. Halaman Login Admin**  
> ![Login Admin](assets/ui-login.png)

> 📸 **2. Dashboard Admin**  
> ![Dashboard](assets/ui-dashboard.png)

> 📸 **3. Manajemen Karyawan**  
> ![Manajemen Karyawan](assets/ui-employee.png)

> 📸 **4. Riwayat Absensi**  
> ![Riwayat Absensi](assets/ui-attendance.png)

> 📸 **5. Kiosk Mode (Face Recognition)**  
> ![Kiosk Mode](assets/ui-kiosk.png)


