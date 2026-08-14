# API_CONTRACT.md - MutaCare REST API Specifications

## 1. Global Conventions & Standards

- **Base URL**: `https://api.mutacare.id/api/v1` (Production) / `http://localhost:5000/api/v1` (Development)
- **Content-Type**: `application/json` (kecuali upload audio: `multipart/form-data`)
- **Authentication**: Bearer Token via HTTP Header: `Authorization: Bearer <supabase_jwt_token>`

### Standard Response Envelope Format

#### Success (2xx)
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

#### Error (4xx / 5xx)
```json
{
  "success": false,
  "message": "Human-readable error explanation",
  "error": {
    "code": "ERROR_CODE_STRING",
    "details": []
  }
}
```

---

## 2. Authentication & User Profile Endpoints

### 2.1. Sync & Get User Profile
Mengambil atau sinkronisasi profil pengguna saat berhasil login via Supabase Auth.

- **Method / Route**: `GET /users/me`
- **Auth Required**: Yes
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": "c1f7a40b-7033-4f9e-a612-4c28479e0a01",
    "fullName": "Muhammad Boby Pratama",
    "nickname": "Boby",
    "avatarUrl": "https://xyz.supabase.co/storage/v1/object/public/avatars/boby.png",
    "gender": "Laki-laki",
    "currentStreak": 3,
    "longestStreak": 5,
    "hasCompletedAssessment": true
  }
}
```

### 2.2. Update Profile
- **Method / Route**: `PATCH /users/me`
- **Auth Required**: Yes
- **Request Body**:
```json
{
  "nickname": "Boby",
  "gender": "Laki-laki",
  "dateOfBirth": "2005-02-03"
}
```
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { ... }
}
```

---

## 3. Assessment & Therapy Plan Endpoints

### 3.1. Submit Initial Assessment
Mengirim hasil kuesioner awal untuk mendeteksi tingkat keparahan selective mutism dan pemicu utama, serta men-generate Therapy Plan mingguan.

- **Method / Route**: `POST /assessments`
- **Auth Required**: Yes
- **Request Body**:
```json
{
  "anxietyScore": 75,
  "mutismSeverity": "moderate",
  "primaryTriggers": ["school", "strangers", "store"],
  "answersPayload": {
    "q1": "kadang-kadang",
    "q2": ["cemas", "takut"],
    "q3": "jarang"
  }
}
```
- **Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "Initial assessment evaluated and therapy plan initialized",
  "data": {
    "assessmentId": "b1a2c3d4-e5f6-7890-abcd-1234567890ab",
    "mutismSeverity": "moderate",
    "aiAnalysisSummary": "Pengguna memiliki tingkat kecemasan situasional moderat terutama di lingkungan publik baru dan sekolah.",
    "therapyPlan": {
      "planId": "e1f2a3b4-5678-90ab-cdef-1234567890cd",
      "currentWeek": 1,
      "status": "active"
    }
  }
}
```

---

## 4. Daily Mood Check-In & Therapy Dashboard

### 4.1. Submit Daily Mood Check-In
Mengirim kondisi mood dan kecemasan harian. Backend akan otomatis menentukan respons empati AI dan menyesuaikan misi harian.

- **Method / Route**: `POST /moods/check-in`
- **Auth Required**: Yes
- **Request Body**:
```json
{
  "mood": "anxious",
  "anxietyLevel": 4,
  "notes": "Merasa cemas karena besok ada tugas kelompok di kampus."
}
```
- **Success Response (200 OK / 201 Created)**:
```json
{
  "success": true,
  "message": "Mood logged successfully",
  "data": {
    "date": "2026-08-14",
    "mood": "anxious",
    "anxietyLevel": 4,
    "aiCompanionMessage": "Hari ini kamu terlihat sedikit cemas. Tidak apa-apa, kita tidak perlu latihan yang berat hari ini. Yuk mulai dengan relaksasi pernapasan singkat.",
    "recommendedAction": "relaxation"
  }
}
```

### 4.2. Get Daily Therapy Dashboard
Mengambil data ringkasan untuk halaman Therapy Home.

- **Method / Route**: `GET /dashboard/daily`
- **Auth Required**: Yes
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Daily dashboard retrieved",
  "data": {
    "user": {
      "nickname": "Boby",
      "currentStreak": 3
    },
    "todayMood": {
      "logged": true,
      "mood": "anxious",
      "anxietyLevel": 4
    },
    "aiCompanion": {
      "message": "Halo Boby! Mari luangkan 3 menit untuk grounding sebelum memulai misi.",
      "recommendedMissionType": "relaxation"
    },
    "weeklyProgress": {
      "weekNumber": 1,
      "percentage": 68,
      "confidenceScore": 60,
      "anxietyAverage": 3.2
    },
    "todayMissions": [
      {
        "id": "m1-uuid",
        "missionType": "relaxation",
        "title": "Relaksasi Pernapasan 4-6",
        "description": "Latihan pernapasan 3 menit untuk menenangkan sistem saraf.",
        "status": "completed",
        "targetReferenceId": null
      },
      {
        "id": "m2-uuid",
        "missionType": "guided_practice",
        "title": "Latihan Menyapa Sederhana",
        "description": "Berlatih merespon sapaan 'Halo' dari AI.",
        "status": "pending",
        "targetReferenceId": "mod-lvl-1-uuid"
      },
      {
        "id": "m3-uuid",
        "missionType": "reflection",
        "title": "Refleksi Harian Singkat",
        "description": "Catat perasaanmu setelah mencoba latihan suara.",
        "status": "pending",
        "targetReferenceId": null
      }
    ]
  }
}
```

---

## 5. Journey & Graded Exposure Pathway

### 5.1. Get Graded Pathway Hierarchy
- **Method / Route**: `GET /journey/pathway`
- **Auth Required**: Yes
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Journey pathway retrieved",
  "data": {
    "currentWeek": 1,
    "weeks": [
      {
        "weekNumber": 1,
        "title": "Mengenali Kecemasan & Suara Pertama",
        "isUnlocked": true,
        "modules": [
          {
            "id": "mod-1-1",
            "title": "Pemahaman Selective Mutism & Siklus CBT",
            "category": "psychoeducation",
            "isCompleted": true,
            "isUnlocked": true
          },
          {
            "id": "mod-1-2",
            "title": "Latihan Level 1: Menyapa",
            "category": "micro_exposure",
            "isCompleted": false,
            "isUnlocked": true
          }
        ]
      },
      {
        "weekNumber": 2,
        "title": "Percakapan Dua Arah Sederhana",
        "isUnlocked": false,
        "modules": []
      }
    ]
  }
}
```

---

## 6. Virtual Exposure Simulation Endpoints

### 6.1. Get List of Simulation Scenarios
- **Method / Route**: `GET /simulations/scenarios`
- **Auth Required**: Yes
- **Query Params**: `category` (optional, e.g. `daily_life`, `academic`, `professional`)
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Scenarios retrieved",
  "data": [
    {
      "id": "scen-kasir-1",
      "category": "daily_life",
      "title": "Kasir Minimarket",
      "personaRole": "Kasir Ramah",
      "description": "Berlatih menyapa dan menjawab kasir saat berbelanja barang.",
      "difficultyLevel": 1,
      "initialAiGreeting": "Halo kak, ada yang bisa saya bantu cari barangnya?"
    }
  ]
}
```

### 6.2. Start Simulation Session
- **Method / Route**: `POST /simulations/start`
- **Auth Required**: Yes
- **Request Body**:
```json
{
  "scenarioId": "scen-kasir-1"
}
```
- **Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "Simulation session started",
  "data": {
    "simulationId": "sim-session-9876",
    "scenarioTitle": "Kasir Minimarket",
    "initialMessage": {
      "senderType": "assistant",
      "text": "Halo kak, selamat siang! Ada kantong belanja atau mau pakai struk digital?"
    }
  }
}
```

### 6.3. Submit User Turn (Audio Speech / Transcribe & AI Response)
Mengunggah suara pengguna (m4a/wav), memproses transkrip Google STT, menyimpan audio ke Supabase Storage, dan memanggil Claude 3.5 Sonnet untuk membalas peran interaksi.

- **Method / Route**: `POST /simulations/:simulationId/turn`
- **Auth Required**: Yes
- **Content-Type**: `multipart/form-data`
- **Form Data Fields**:
  - `audio`: File buffer (`audio/m4a`, `audio/wav`)
  - `speechDurationSeconds`: `2.4` (optional numeric float)
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Turn processed successfully",
  "data": {
    "userTurn": {
      "transcription": "Iya, mau pakai struk digital saja mas.",
      "speechDurationSeconds": 2.4,
      "audioUrl": "https://xyz.supabase.co/storage/v1/object/authenticated/audio-sessions/user_id/turn_1.m4a"
    },
    "aiTurn": {
      "senderType": "assistant",
      "text": "Baik kak, nomor HP atau emailnya boleh disebutkan?",
      "supportiveFeedback": "Responsmu terdengar sangat jelas dan tenang! Lanjutkan ke langkah berikutnya."
    }
  }
}
```

### 6.4. End Simulation & Generate CBT Summary
- **Method / Route**: `POST /simulations/:simulationId/end`
- **Auth Required**: Yes
- **Request Body**:
```json
{
  "anxietyScoreAfter": 2
}
```
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Simulation concluded and evaluated",
  "data": {
    "simulationId": "sim-session-9876",
    "totalDurationSeconds": 90,
    "turnsCount": 4,
    "confidenceScore": 82,
    "feedbackSummary": "Hebat! Kamu berhasil merespon 4 giliran percakapan secara runtut tanpa jeda panjang.",
    "newBadgeUnlocked": {
      "id": "first_conversation",
      "title": "First Conversation",
      "iconName": "seedling"
    }
  }
}
```

---

## 7. Post-Session CBT Reflection

### 7.1. Submit Reflection
- **Method / Route**: `POST /reflections`
- **Auth Required**: Yes
- **Request Body**:
```json
{
  "missionId": "m3-uuid",
  "simulationId": "sim-session-9876",
  "perceivedAnxietyBefore": 4,
  "perceivedAnxietyAfter": 2,
  "whatWentWell": "Saya berhasil mengeluarkan suara di giliran pertama tanpa ragu.",
  "negativeThoughtIdentified": "Saya takut suara saya terdengar aneh bagi orang lain.",
  "rationalReframing": "Kenyataannya kasir/AI merespon ramah dan tidak ada hal buruk yang terjadi."
}
```
- **Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "Reflection saved successfully",
  "data": {
    "reflectionId": "ref-uuid-5544",
    "aiEncouragementFeedback": "Kamu melakukan reframing kognitif yang sangat tepat. Bukti nyata menunjukkan suaramu diterima dengan baik."
  }
}
```

---

## 8. Progress & Metrics Dashboard

### 8.1. Get Comprehensive Progress Analytics
- **Method / Route**: `GET /progress/metrics`
- **Auth Required**: Yes
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Progress metrics retrieved",
  "data": {
    "confidenceTimeline": [
      { "week": "Week 1", "score": 45 },
      { "week": "Week 2", "score": 62 },
      { "week": "Week 3", "score": 78 }
    ],
    "anxietyTrend": [
      { "date": "2026-08-10", "level": 4 },
      { "date": "2026-08-11", "level": 4 },
      { "date": "2026-08-12", "level": 3 },
      { "date": "2026-08-13", "level": 2 },
      { "date": "2026-08-14", "level": 2 }
    ],
    "totalSpeakingDurationMinutes": 28.5,
    "completedMissionsCount": 18,
    "totalMissionsTarget": 25,
    "badges": [
      {
        "id": "first_voice",
        "title": "First Voice",
        "earnedAt": "2026-08-10T10:00:00Z"
      },
      {
        "id": "first_conversation",
        "title": "First Conversation",
        "earnedAt": "2026-08-14T11:20:00Z"
      }
    ]
  }
}
```
