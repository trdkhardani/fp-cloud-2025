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

## (4) Pengujian API dan Antarmuka

---

### 🔹 Uji Endpoint Aplikasi

Endpoint backend diuji menggunakan **Swagger UI** (untuk endpoint terdokumentasi) dan **Thunder Client** (untuk endpoint tambahan seperti login admin). Semua endpoint berjalan pada backend FastAPI dan terkoneksi dengan MongoDB di VM worker.

---

### 📘 A. Endpoint yang Diuji via Swagger UI

#### 1. `POST /employee/` – Tambah Karyawan  
> 📸 Swagger UI - Tambah Karyawan  
> ![Swagger Employee Add](assets/swagger-employee-register.png)

#### 2. `GET /employee/` – Ambil Semua Karyawan  
> 📸 Swagger UI - Lihat Semua Karyawan  
> ![Swagger Employee List](assets/swagger-employee-list.png)

#### 3. `GET /employee/{id}` – Detail Karyawan  
> 📸 Swagger UI - Detail Karyawan  
> ![Swagger Employee Detail](assets/swagger-employee-detail.png)

#### 4. `PUT /employee/{id}` – Edit Karyawan  
> 📸 Swagger UI - Edit Karyawan  
> ![Swagger Employee Edit](assets/swagger-employee-edit.png)

#### 5. `DELETE /employee/{id}` – Hapus Karyawan  
> 📸 Swagger UI - Hapus Karyawan  
> ![Swagger Employee Delete](assets/swagger-employee-delete.png)

#### 6. `POST /face/register` – Register Wajah  
> 📸 Swagger UI - Register Wajah  
> ![Swagger Face Register](assets/swagger-face-register.png)

#### 7. `POST /face/recognize` – Deteksi Wajah  
> 📸 Swagger UI - Recognize Face  
> ![Swagger Face Recognize](assets/swagger-face-recognize.png)

#### 8. `POST /attendance/checkin` – Absen Masuk  
> 📸 Swagger UI - Absen Masuk  
> ![Swagger Attendance Checkin](assets/swagger-attendance-checkin.png)

#### 9. `POST /attendance/checkout` – Absen Keluar  
> 📸 Swagger UI - Absen Keluar  
> ![Swagger Attendance Checkout](assets/swagger-attendance-checkout.png)

#### 10. `GET /attendance` – Semua Data Absensi  
> 📸 Swagger UI - Semua Data Absensi  
> ![Swagger Attendance](assets/swagger-attendance.png)

#### 11. `GET /attendance/{employee_id}` – Riwayat Absensi Karyawan  
> 📸 Swagger UI - Riwayat Absensi Karyawan  
> ![Swagger Attendance History](assets/swagger-attendance-history.png)

#### 12. `GET /api/attendance/mode` – Mode Absensi Saat Ini  
> 📸 Swagger UI - Mode Absensi  
> ![Swagger Attendance Mode](assets/swagger-attendance-mode.png)

#### 13. `GET /` – Root Endpoint  
> 📸 Swagger UI - Root  
> ![Swagger Root](assets/swagger-root.png)

#### 14. `GET /api/config` – Get Config  
> 📸 Swagger UI - Get Config  
> ![Swagger Get Config](assets/swagger-get-config.png)

#### 15. `POST /api/config` – Update Config  
> 📸 Swagger UI - Update Config  
> ![Swagger Update Config](assets/swagger-update-config.png)

#### 16. `GET /api/models` – Get Available Models  
> 📸 Swagger UI - Model List  
> ![Swagger Get Models](assets/swagger-get-models.png)

#### 17. `POST /api/recognize-face` – Recognize Face  
> 📸 Swagger UI - Recognize Face  
> ![Swagger Recognize Face](assets/swagger-api-recognize.png)

#### 18. `POST /api/attendance` – Record Attendance  
> 📸 Swagger UI - Record Attendance  
> ![Swagger Record Attendance](assets/swagger-api-attendance-post.png)

#### 19. `GET /api/attendance` – Get Attendance History  
> 📸 Swagger UI - Attendance History  
> ![Swagger Get Attendance](assets/swagger-api-attendance-get.png)

#### 20. `GET /api/employees` – Get All Employees  
> 📸 Swagger UI - Get Employees  
> ![Swagger Get Employees](assets/swagger-api-employees-get.png)

#### 21. `POST /api/employees/enroll` – Enroll Employee  
> 📸 Swagger UI - Enroll Employee  
> ![Swagger Enroll Employee](assets/swagger-api-employees-enroll.png)

#### 22. `DELETE /api/employees/{employee_id}` – Delete Employee  
> 📸 Swagger UI - Delete Employee  
> ![Swagger Delete Employee](assets/swagger-api-employees-delete.png)

#### 23. `PUT /api/employees/{employee_id}` – Update Employee  
> 📸 Swagger UI - Update Employee  
> ![Swagger Update Employee](assets/swagger-api-employees-update.png)

#### 24. `GET /api/employees/{employee_id}/photo` – Get Employee Photo  
> 📸 Swagger UI - Get Employee Photo  
> ![Swagger Get Employee Photo](assets/swagger-api-employee-photo.png)

#### 25. `GET /api/attendance/{attendance_id}/photo` – Get Attendance Photo  
> 📸 Swagger UI - Get Attendance Photo  
> ![Swagger Get Attendance Photo](assets/swagger-api-attendance-photo.png)

#### 26. `GET /health` – Health Check  
> 📸 Swagger UI - Health Check  
> ![Swagger Health](assets/swagger-health.png)

#### 27. `POST /api/debug-face` – Debug Face Recognition  
> 📸 Swagger UI - Debug Face  
> ![Swagger Debug Face](assets/swagger-api-debug-face.png)

---

### 🖥️ C. Tampilkan Antarmuka Aplikasi

Berikut hasil tangkapan layar (screenshot) antarmuka frontend aplikasi saat digunakan.

> 📸 **1. Halaman Login Admin**
> ![Login Admin](assets/admin-login.jpeg)

> 📸 **2. Fitur Kamera dan Statistik Admin**
> ![Users Page](assets/admin-cam.jpeg)

> 📸 **3. Manajemen Karyawan (Users Tab)**
> ![Users Page](assets/admin-users.jpeg)

> 📸 **4. Tambah Karyawan - Step 1 (Data)**
> ![Add User Step 1](assets/adduser.jpeg)

> 📸 **5. Tambah Karyawan - Step 2 (Ambil Foto)**
> ![Add User Step 2](assets/ui-add-user-step2.png)

> 📸 **6. Kiosk Mode**
> ![Camera Tab](assets/camera-kiosk.png)

> 📸 **7. Admin History**
> ![Kiosk Mode](assets/admin-history.jpeg)

> 📸 **8. Pengaturan Model Face Recognition**       
> ![Settings - Recognition Model](assets/admin-settings.png)

---

### 📂 Tabel Ringkasan Endpoint

### 📄 Ringkasan Endpoint API

| No. | Method | Endpoint                                      | Deskripsi                               | Tools          |
|-----|--------|-----------------------------------------------|-----------------------------------------|----------------|
| 1   | POST   | /employee/                                    | Tambah data karyawan                    | Swagger        |
| 2   | GET    | /employee/                                    | Ambil semua data karyawan               | Swagger        |
| 3   | GET    | /employee/{id}                                | Ambil detail karyawan                   | Swagger        |
| 4   | PUT    | /employee/{id}                                | Edit data karyawan                      | Swagger        |
| 5   | DELETE | /employee/{id}                                | Hapus data karyawan                     | Swagger        |
| 6   | POST   | /face/register                                | Daftarkan wajah (base64)                | Swagger        |
| 7   | POST   | /face/recognize                               | Pengenalan wajah (kiosk mode)           | Swagger        |
| 8   | POST   | /attendance/checkin                           | Absen masuk                             | Swagger        |
| 9   | POST   | /attendance/checkout                          | Absen keluar                            | Swagger        |
|10   | GET    | /attendance                                   | Semua data absensi                      | Swagger        |
|11   | GET    | /attendance/{employee_id}                     | Riwayat absensi karyawan                | Swagger        |
|12   | GET    | /api/attendance/mode                          | Get mode absensi saat ini               | Swagger        |
|13   | GET    | /                                             | Endpoint root                           | Swagger        |
|14   | GET    | /api/config                                   | Ambil konfigurasi sistem                | Swagger        |
|15   | POST   | /api/config                                   | Update konfigurasi sistem               | Swagger        |
|16   | GET    | /api/models                                   | List model face recognition             | Swagger        |
|17   | POST   | /api/recognize-face                           | Pengenalan wajah (API langsung)         | Swagger        |
|18   | POST   | /api/attendance                               | Tambah absensi manual                   | Swagger        |
|19   | GET    | /api/attendance                               | Riwayat absensi manual                  | Swagger        |
|20   | GET    | /api/employees                                | List semua karyawan                     | Swagger        |
|21   | POST   | /api/employees/enroll                         | Enroll karyawan                         | Swagger        |
|22   | DELETE | /api/employees/{employee_id}                  | Hapus karyawan                          | Swagger        |
|23   | PUT    | /api/employees/{employee_id}                  | Update data karyawan                    | Swagger        |
|24   | GET    | /api/employees/{employee_id}/photo            | Ambil foto karyawan                     | Swagger        |
|25   | GET    | /api/attendance/{attendance_id}/photo         | Ambil foto absensi                      | Swagger        |
|26   | GET    | /health                                       | Cek status backend                      | Swagger        |
|27   | POST   | /api/debug-face                               | Debug hasil deteksi wajah               | Swagger        |

---

Semua endpoint dan tampilan diuji pada sistem yang sudah dideploy di Google Cloud Platform dengan database MongoDB yang berjalan di VM worker.


