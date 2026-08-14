# PRODUCT_SPEC.md - MutaCare Product Specification

## 1. Product Overview & Vision
* **Product Name**: MutaCare
* **Category**: AI Therapy Companion & Graded Exposure Platform
* **Target Audience**: Penderita *Selective Mutism* (anak-anak hingga dewasa muda) yang mengalami hambatan bicara di situasi sosial tertentu.
* **Core Value Proposition**:
  * MutaCare **bukanlah platform kursus *public speaking***, melainkan **pendamping terapi pribadi (AI Therapy Companion)** berbasis *Cognitive Behavioral Therapy* (CBT) dan *Graded Exposure*.
  * Menawarkan lingkungan latihan virtual yang aman, bertahap, bebas tekanan, terjangkau, dan dapat diakses kapan saja.
  * Yang menjadi esensi produk bukan sekadar teknologi AI, melainkan **progres nyata (*Confidence & Anxiety Milestones*)** pengguna menuju interaksi dunia nyata.

---

## 2. Theoretical & Therapeutic Foundations
MutaCare mengintegrasikan prinsip-prinsip intervensi psikologis klinis:
1. **Cognitive Behavioral Therapy (CBT) & Modular CBT (MCBT)**:
   * Mengurai siklus distorsi kognitif (*pikiran negatif -> kecemasan fisik -> perilaku menghindar/bisu*).
   * Menyediakan reframing kognitif dan latihan refleksi berkala pasca-latihan.
2. **Graded Exposure (Eksposur Bertahap)**:
   * Desensitisasi kecemasan sosial melalui hierarki latihan terstruktur dari tekanan terendah (mikro-interaksi) hingga skenario kompleks.
3. **Virtual Role-Playing & Safe Space**:
   * Pengguna mempraktikkan keterampilan komunikasi dengan karakter AI tanpa takut dinilai atau konsekuensi sosial negatif.
4. **Somatic & Grounding Support**:
   * Panduan relaksasi napas dan otot untuk menstabilkan sistem saraf otonom sebelum dan selama sesi eksposur.

---

## 3. End-to-End User Journey

### A. Day 1: Onboarding & Baseline Assessment
1. **Onboarding**: Edukasi singkat mengenai konsep *small steps*, keamanan data, dan pendekatan terapi MutaCare.
2. **Authentication**: Registrasi dan pembuatan akun aman.
3. **Initial Assessment**:
   * Kuesioner diagnostik singkat untuk mengukur tingkat keparahan *selective mutism*, pemicu utama (*trigger environment*), dan baseline tingkat kecemasan.
4. **AI Therapy Plan Generation**:
   * Sistem merumuskan *Personalized Therapy Plan* mingguan yang disesuaikan dengan hasil *assessment*.

### B. Daily Core Loop (Rutinitas Terapi Harian)
```text
[Open App]
    │
    ▼
[Daily Mood & Anxiety Check-in] (😊 / 😐 / 😟 / 😢)
    │
    ▼
[Adaptive Daily Recommendation]
    ├─ Jika Cemas Tinggi ──► Rekomendasi: Relaksasi / Emergency Breathing
    └─ Jika Kondisi Siap ──► Rekomendasi: Today's Mission (Roleplay / Practice)
    │
    ▼
[Execution: Guided Practice / Virtual Simulation] (Voice Input via ASR + LLM Reply)
    │
    ▼
[Post-Session Reflection & Journaling]
    │
    ▼
[Progress & Streak Update] (Confidence Gain, Speaking Time, Timeline Log)
```

### C. Weekly Progression (Graded Exposure Pathway)
* Latihan dan skenario simulasi dikunci (*locked*) dan hanya terbuka secara gradual ketika metrik kenyamanan pada level sebelumnya terpenuhi:
  * **Minggu 1**: Mengenali pemicu cemas & mikro-eksposur (mengucapkan "Halo" / kata tunggal).
  * **Minggu 2**: Relaksasi pernapasan terintegrasi & perkenalan nama singkat.
  * **Minggu 3**: Menjawab pertanyaan pilihan tertutup dua arah.
  * **Minggu 4**: Percakapan dua arah informal (teman sebaya).
  * **Minggu 5**: Skenario transaksional (kasir minimarket, memesan makanan).
  * **Minggu 6**: Skenario otoritas & akademik (guru, dosen, dokter).
  * **Minggu 7+**: Skenario grup (diskusi kelompok, presentasi virtual).

---

## 4. Key Features & Functional Modules

### 1. Therapy Home Dashboard
* **Mood Check-in Widget**: Pemicu penyesuaian intensitas misi harian.
* **Today's Mission Card**: Target tugas spesifik (contoh: *1x Relaksasi Pernafasan + 1x Latihan Sapa Kasir + 1x Refleksi Singkat*).
* **AI Therapy Companion Status**: Pesan empatik personal dari AI berdasarkan riwayat latihan terakhir.
* **Quick Access / Emergency Calm Tools**: Akses instan ke *Emergency Breathing Box* & teknik *Grounding 5-4-3-2-1*.

### 2. Journey (The Graded Pathway)
* Visualisasi peta peta jalan terapi (*step-by-step tree/timeline*) yang berjenjang.
* Setiap modul berisi 3 komponen:
  * *Materi/Psikoedukasi Singkat* (CBT & pemahaman diri).
  * *Praktik Bertahap* (Guided voice exercise).
  * *Refleksi Sesi*.

### 3. Virtual Exposure Simulation (Interactive Role-Play)
* **Kategori Skenario**:
  * *Situasi Sehari-hari*: Kasir toko, menyapa tetangga, memesan makanan.
  * *Situasi Akademik*: Menjawab pertanyaan dosen/guru, bertanya di kelas.
  * *Situasi Profesional*: Wawancara kerja simulasi.
  * *Situasi Sosial & Keluarga*: Interaksi teman baru, kumpul keluarga.
* **Mekanisme Interaksi**:
  * Pengguna berbicara melalui mikrofon perangkat.
  * Audio ditranskripsikan secara akurat via Google Cloud Speech-to-Text.
  * AI (Claude 3.5 Sonnet) membalas secara kontekstual sesuai persona peran dan memberikan umpan balik verbal yang suportif.

### 4. Progress & Milestones Dashboard
* **Confidence Timeline**: Visualisasi peningkatan rasa percaya diri dari minggu ke minggu.
* **Anxiety Trend Tracker**: Grafik tren penurunan tingkat kecemasan sosial.
* **Speaking Duration Counter**: Akumulasi total waktu berbicara aktif dalam simulasi.
* **Milestone Achievements**:
  * 🌱 *First Voice*: Mengucapkan suara/kata pertama di dalam sistem.
  * 🌿 *First Conversation*: Menyelesaikan 1 sesi percakapan dua arah penuh.
  * 🌳 *Social Explorer*: Menyelesaikan 5 skenario simulasi berbeda.
  * 🏆 *Public Voice*: Berhasil menyelesaikan simulasi presentasi di depan kelas.
* **Week Streak & Activity Calendar**: Menjaga konsistensi terapi harian.

### 5. Learning Resources & Profile
* **Learning Resources**: Ensiklopedia pendukung mengenai *Selective Mutism*, panduan untuk keluarga/guru, dan strategi koping kognitif (tidak mendominasi alur utama).
* **Profile**: Manajemen data pribadi, riwayat hasil *assessment*, ekspor laporan kemajuan terapi, dan pengaturan privasi data suara.

---

## 5. Technical Requirements & AI Integration

| Komponen | Spesifikasi / Layanan | Tanggung Jawab & Implementasi |
| :--- | :--- | :--- |
| **Backend Framework** | Node.js + Express.js (TypeScript) | REST API, manajemen *business logic*, routing sesi terapi |
| **Database** | Supabase (PostgreSQL) | Relasi data pengguna, assessment, mood, progress log, therapy plans |
| **Audio Storage** | Supabase Storage Bucket | Penyimpanan arsip file audio rekaman latihan (`audio-sessions/`) |
| **Speech Recognition** | Google Cloud Speech-to-Text API | Transkripsi suara pengguna berbahasa Indonesia secara *real-time/near-realtime* |
| **LLM Engine** | Anthropic Claude 3.5 Sonnet API | Persona *roleplay*, generator respons CBT empatik, ekstraksi metrik performa |
| **Frontend** | React Native (Expo) + NativeWind | Antarmuka interaktif mobile, manajemen audio recording, state management |

---

## 6. Success Metrics & Validation
* **Therapeutic Engagement**: Tingkat penyelesaian *Daily Missions* >= 75% per minggu.
* **Voice Efficacy**: Peningkatan durasi rata-rata berbicara (*speaking duration*) secara bertahap dari level dasar.
* **Psychological Metrics**: Penurunan skor *Subjective Units of Distress Scale* (SUDS) atau tingkat kecemasan yang dilaporkan pada kuesioner berkala.
* **System Usability**: Antarmuka mudah digunakan oleh target pengguna tanpa memicu kecemasan kognitif tambahan.
