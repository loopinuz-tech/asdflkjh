# 🦊 EduFox (Foxford) — Professional IELTS Mock & Preparation Platform

<p align="center">
  <img src="frontend/public/fox-mascot.svg" alt="EduFox Mascot" width="120" height="120" />
</p>

<p align="center">
  <strong>Zamonaviy, to'liq avtomatlashtirilgan Computer-Delivered (CD) IELTS mock imtihonlari va sun'iy intellekt (Google Gemini AI) asosidagi interaktiv tayyorgarlik platformasi.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Google_Gemini-AI-8E75C2?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI" />
  <img src="https://img.shields.io/badge/InPay.uz-Payments-00C48C?style=for-the-badge" alt="InPay" />
  <img src="https://img.shields.io/badge/Telegram_Bot-Active-26A5E4?style=for-the-badge&logo=telegram&logoColor=white" alt="Telegram Bot" />
</p>

---

## 📑 Mundarija

- [Loyiha haqida](#-loyiha-haqida)
- [Asosiy Imkoniyatlar va Funksiyalar](#-asosiy-imkoniyatlar-va-funksiyalar)
  - [1. Reading Engine (O'qish bo'limi)](#1-reading-engine-oqish-bolimi)
  - [2. Listening Engine (Tinglash bo'limi)](#2-listening-engine-tinglash-bolimi)
  - [3. Writing Engine va Gemini AI Baholash](#3-writing-engine-va-gemini-ai-baholash)
  - [4. Speaking Engine va Ovozli AI Examiner](#4-speaking-engine-va-ovozli-ai-examiner)
  - [5. Smart Vocabulary & SRS (Spaced Repetition System)](#5-smart-vocabulary--srs-oraliqli-takrorlash)
  - [6. Progress & Tahliliy Analitika Hub](#6-progress--tahliliy-analitika-hub)
  - [7. Obunalar, To'lovlar va Promo-kodlar](#7-obunalar-tolovlar-va-promo-kodlar)
  - [8. Telegram Bot va Autentifikatsiya Ekotizimi](#8-telegram-bot-va-autentifikatsiya-ekotizimi)
  - [9. Keng qamrovli Administrator Paneli (Admin Portal)](#9-keng-qamrovli-administrator-paneli-admin-portal)
- [Texnologik Stek](#-texnologik-stek)
- [Ma'lumotlar Bazasi Strukturasi](#-malumotlar-bazasi-strukturasi)
- [Loyiha Katalog Strukturasi](#-loyiha-katalog-strukturasi)
- [O'rnatish va Ishga Tushirish](#-ornatish-va-ishga-tushirish)
  - [Talablar](#talablar)
  - [Muhit O'zgaruvchilari (.env)](#muhit-ozgaruvchilari-env)
  - [Ma'lumotlar Bazasini Initsializatsiya Qilish](#malumotlar-bazasini-initsializatsiya-qilish)
  - [Dasturni Ishga Tushirish](#dasturni-ishga-tushirish)
  - [Docker orqali Ishga Tushirish](#docker-orqali-ishga-tushirish)
- [API Marshrutlari Xaritasi](#-api-marshrutlari-xaritasi)
- [Xavfsizlik va Ishlash Samaradorligi](#-xavfsizlik-va-ishlash-samaradorligi)
- [Litsenziya](#-litsenziya)

---

## 🌟 Loyiha haqida

**EduFox (Foxford)** — talabalar va o'qituvchilarga haqiqiy **Computer-Delivered (CD) IELTS** imtihoni muhitini 100% simulyatsiya qilib beruvchi to'liq avtonom ta'lim platformasi. Platforma rasmiy Cambridge standartlari asosidagi to'liq mock testlarni, sun'iy intellekt orqali Writing va Speaking javoblarini baholashni, oraliqli takrorlash (SRS) lug'at tizimini va qulay boshqaruv panelini o'z ichiga oladi.

Platforma **Monorepo** arxitekturasi asosida qurilgan bo'lib, yuqori yuklamalarga mo'ljallangan va zamonaviy web texnologiyalardan foydalanadi.

---

## 🚀 Asosiy Imkoniyatlar va Funksiyalar

### 1. Reading Engine (O'qish bo'limi)

Rasmiy CD-IELTS interfeysiga to'liq moslashtirilgan interaktiv o'qish moduli:

- **Split-Screen UI**: Chap tomonda matn (passage), o'ng tomonda savollar bloki. Har ikkala panel bir-biridan mustaqil scroll bo'ladi.
- **Smart Text Highlighter**: Matndagi istalgan so'z yoki gapni belgilab, 3 xil rangda (sariq, yashil, pushti) highlight qilish imkoniyati.
- **Inline Note-Taking**: Matn ustida shaxsiy izoh va eslatmalar qoldirish.
- **AI Dictionary Modal**: Matnda uchragan murakkab yoki notanish so'z ustiga bosilganda, in-test rejimida uning ma'nosi, transkripsiyasi va o'zbekcha tarjimasini ko'rsatish.
- **Matn o'lchamini sozlash**: Matn shriftini kattalashtirish yoki kichiklashtirish (`A-` / `A+`).
- **Focus / Zen rejimi**: Chalg'ituvchi barcha elementlarni yashirib, faqat matn va savolga e'tibor qaratish.
- **14+ IELTS Savol Turlari**:
  - *Multiple Choice (bittalik va ko'p tanlovli)*
  - *True / False / Not Given & Yes / No / Not Given*
  - *Matching Headings (Sarlavhalarni moslashtirish)*
  - *Matching Information & Matching Features*
  - *Sentence Completion & Summary Completion*
  - *Table, Flow-Chart va Diagram Label Completion*
  - *Short Answer Questions*
- **Avtomatik Baholash va Band Score**: Rasmiy IELTS 9-band shkalasi bo'yicha darhol xom ball (Raw score: 0-40) va umumiy Band (0-9.0) hisoblanadi.
- **Batafsil Tahlil va Explanations**: Har bir savol uchun to'g'ri javob matnning qaysi joyidan olinganligi (passage reference) va izohi bilan ko'rsatiladi.

---

### 2. Listening Engine (Tinglash bo'limi)

Haqiqiy IELTS CD-Listening imtihoni muhitini yaratuvchi modul:

- **CD-IELTS Interfeys Simulyatsiyasi**: 4 ta Section bo'yicha navigatsiya, qolgan vaqt hisoblagichi va savollar xaritasi.
- **Nazoratli Audio Pleyer**: Imtihon qoidalariga binoan audioni faqat belgilangan tartibda tinglash, ortga qaytarish cheklovlari va audio to'xtaganda avtomatik navbatdagi bo'limga o'tish.
- **Interaktiv Xaritalar va Diagrammalar**: *Plan, Map, Diagram Labeling* savollarida rasmli interaktiv maydonlar.
- **Form / Note Completion**: Bo'sh joylarni to'ldirishda real vaqtda kiritish qulayligi va harflar registriga (Case-insensitive) sezgirlikni to'g'ri tekshirish.
- **Fuzzy Matching va Muqobil Javoblar**: Cambridge talablariga mos ravishda qabul qilinadigan sinonimlar, qisqartmalar va muqobil to'g'ri variantlar bazasi.
- **Transkript va Audio Sinxronizatsiyasi**: Test topshirilgach, butun audio matni (transcript) va to'g'ri javob kalitlari ochiladi.

---

### 3. Writing Engine va Gemini AI Baholash

IELTS Writing Task 1 va Task 2 bo'yicha inqilobiy sun'iy intellekt tekshiruv tizimi:

- **Task 1 & Task 2 qo'llab-quvvatlashi**:
  - *Task 1*: Akademik grafiklar, jadvallar, diagrammalar, jarayonlar va xaritalar tasviri bilan (kamida 150 so'z).
  - *Task 2*: Dolzarb muammolar, fikr-mulohazalar, afzallik va kamchiliklar bo'yicha insholar (kamida 250 so'z).
- **Jonli So'z Hisoblagich va Auto-Save**: Yozish jarayonida so'zlar soni real vaqtda hisoblab boriladi va brauzer yopilib ketsa ham qoralamalar avtomatik saqlanadi.
- **Google Gemini AI Professional Examiner**:
  - Rasmiy IELTS 4 ta baholash mezonlari bo'yicha alohida ball (0.5 qadam bilan 1.0 dan 9.0 gacha):
    1. **Task Achievement / Task Response** (Vazifa to'liq ochilganligi)
    2. **Coherence & Cohesion** (Mantiqiy bog'liqlik va paragraflar tuzilishi)
    3. **Lexical Resource** (Lug'at boyligi va iboralar to'g'ri qo'llanilishi)
    4. **Grammatical Range & Accuracy** (Grammatik xilma-xillik va aniqlik)
  - **Overall Estimated Band**: 4 ta mezon asosida yaxlitlangan umumiy ball.
  - **Inline Xatolar Tuzatmasi**: Matndagi har bir xato qizil/yashil bilan belgilanib, to'g'ri varianti va nima uchun noto'g'riligi tushuntiriladi.
  - **Advanced Vocabulary Takliflari**: Oddiy so'zlarni akademik C1/C2 darajasidagi sinonimlarga almashtirish bo'yicha amaliy maslahatlar.
  - **Kuchli va Kuchsiz Tomonlar Tahlili**: Keyingi safar ballni oshirish uchun yo'naltiruvchi xulosalar.

---

### 4. Speaking Engine va Ovozli AI Examiner

IELTS Speaking imtihonini mustaqil ravishda topshirish va sun'iy intellektdan professional fidbek olish:

- **To'liq 3 Qismli Format**:
  - *Part 1*: Tanish mavzular bo'yicha tezkor savol-javoblar (oila, o'qish, qiziqishlar).
  - *Part 2 (Cue Card)*: Berilgan kartochka mavzusi, 1 daqiqa tayyorgarlik taymeri va 2 daqiqalik monolog nutq yozib olish.
  - *Part 3*: Mavzu bo'yicha chuqur tahliliy va mavhum savollar.
- **Ovoz Yozish (MediaRecorder API)**: To'g'ridan-to'g'ri brauzer orqali yuqori sifatli audio yozib olish va serverga uzatish.
- **Ovozli Gemini AI Baholash Mezonlari**:
  1. **Fluency & Coherence** (Ravonlik va nutqning uzviyligi)
  2. **Lexical Resource** (So'z boyligi)
  3. **Grammatical Range & Accuracy** (Grammatika)
  4. **Pronunciation** (Talaffuz va urg'u)
- **Audio Transkripti**: Talabaning aytgan barcha gaplari matnga o'girilib, undagi grammatik va leksik kamchiliklar ko'rsatib beriladi.

---

### 5. Smart Vocabulary & SRS (Oraliqli Takrorlash)

So'zlarni uzoq muddatli xotiraga mustahkamlash uchun Anki / SuperMemo (SM-2) algoritmi asosida ishlovchi tizim:

- **SRS Algoritmi**: Har bir so'z takrorlanganda, foydalanuvchi qiyinchilik darajasini tanlaydi:
  - `Again` (Qayta takrorlash - 1 kundan keyin)
  - `Hard` (Qiyin - 2 kundan keyin)
  - `Good` (Yaxshi - oraliq uzaytiriladi)
  - `Easy` (Oson - maksimal oraliqqa ko'chiriladi)
- **Mastery Status**: So'zlar bosqichma-bosqich rivojlanadi: `New` ➔ `Learning` ➔ `Review` ➔ `Mastered`.
- **IELTS Mavzulari Bo'yicha Filtrlash**: Environment, Technology, Education, Health, Crime, Culture, Globalization, Science va h.k.
- **Boyitilgan Karta Tarkibi**: So'zning transkripsiyasi, so'z turkumi, batafsil inglizcha ta'rifi, IELTS kontekstidagi namunaviy gaplar va audio talaffuzi.

---

### 6. Progress & Tahliliy Analitika Hub

O'quvchining barcha faoliyatini kuzatib boruvchi markaz:

- **6 Qirrali Ko'nikmalar Radari (Radar Chart)**: Reading, Listening, Writing, Speaking, Vocabulary va Grammatika bo'yicha muvozanatni vizual ko'rsatish.
- **Oylik Faollik Xaritasi (Activity Heatmap)**: So'nggi 30 kunlik o'qish vaqtini soatlar kesimida ko'rsatuvchi interaktiv grafik.
- **Maqsadli Ball vs Joriy Natija**: Foydalanuvchining Target Band (masalan, 7.5) va joriy o'rtacha balli o'rtasidagi farqni monitoring qilish.
- **Testlar Tarixi**: Barcha topshirilgan testlar, sana, sarflangan vaqt va to'plangan ballar arxivi.
- **Saved Items (Sevimlilar)**: Keyinchalik qayta ko'rib chiqish uchun saqlangan savollar, murakkab so'zlar va namunaviy insholar.

---

### 7. Obunalar, To'lovlar va Promo-kodlar

Tizimda to'liq avtomatlashtirilgan monetizatsiya va billing moduli mavjud:

- **Tarif Rejalari (Plans)**:
  - `Free Trial`: Cheklangan mock testlar va bazaviy mashg'ulotlar.
  - `Monthly Pro`: Cheksiz Reading & Listening, to'liq AI Writing va Speaking baholashlari.
  - `Yearly Premium`: Barcha imkoniyatlar + shaxsiy o'quv rejasi va ustuvor AI navbati.
  - `Lifetime Access`: Cheksiz va umrbod to'liq kirish huquqi.
- **InPay.uz To'lov Shlyuzi**: O'zbekiston milliy to'lov tizimlari (**Uzcard, Humo, Click, Payme**) hamda xalqaro kartalar orqali xavfsiz to'lovlarni qabul qilish.
- **Kuponlar va Chegirmalar (Coupons Engine)**:
  - Foizli chegirmalar (masalan, 20%, 50%)
  - Qat'iy summali chegirmalar (USD yoki UZS formatida)
  - Foydalanishlar soni bo'yicha cheklov (`max_uses`)
  - Amal qilish muddati bo'yicha avtomatik tekshiruv.

---

### 8. Telegram Bot va Autentifikatsiya Ekotizimi

O'zbekiston auditoriyasi uchun qulay bo'lgan integratsiyalar:

- **Telegram Bot (`@edu_foxbot`)**: Foydalanuvchini platforma bilan bog'lash, bildirishnomalar yuborish va tezkor buyruqlar.
- **Telegram Login Widget**: Telefon raqami yoki kod kiritmasdan, Telegram orqali bitta tugma bilan autentifikatsiya.
- **QR Kod orqali Kirish**: Kompyuterdagi ekranda hosil bo'lgan QR kodni Telegram orqali skanerlab platformaga kirish.
- **Google OAuth 2.0**: Bitta bosish bilan Google hisobi orqali ro'yxatdan o'tish.
- **JWT Xavfsizlik**: Standart email va parol orqali ro'yxatdan o'tish, shifrlangan parollar (bcryptjs) va xavfsiz JSON Web Token sessiyalari.
- **Personalized Onboarding**: Ro'yxatdan o'tgandan so'ng maqsadli ball (Target band), imtihon sanasi va joriy darajani aniqlovchi so'rovnoma.

---

### 9. Keng qamrovli Administrator Paneli (Admin Portal)

Sayt egalari va moderatorlar uchun to'liq boshqaruv markazi:

- **Admin Dashboard**:
  - Platforma statistikasi: Jami foydalanuvchilar, faol obunachilar, yaratilgan testlar, topshirilgan urinishlar soni.
  - Jonli xotira telemetriyasi: Server diski hajmi, bo'sh joy va yuklangan media hajmi monitoringi.
- **Testlar Konstruktori (Visual Test Builder)**:
  - Yangi Reading va Listening testlarini yaratish, bo'limlarga ajratish, passage matnlari va audio fayllarni biriktirish.
  - Savollarni guruhlash, savol turini tanlash, to'g'ri javoblar va tushuntirishlarni kiritish.
- **Aqlli Ko'p Formatli Import Tizimi (AI Importer)**:
  - **HTML Import**: Cambridge IELTS HTML fayllarini yuklab, Gemini AI orqali avtomatik bazaga to'liq test holida o'tkazish.
  - **PDF Import**: Cambridge kitoblari yoki test PDF varaqalarini avtomatik savol va javoblarga ajratish.
  - **JSON Import**: Oldindan tuzilgan JSON test formatlarini bir zumda yuklash.
  - **Audio Import**: Listening treklarni ommaviy yuklab, qismlarga bog'lash.
- **Foydalanuvchilar Boshqaruvi (Users Management)**:
  - Barcha foydalanuvchilar ro'yxati, qidiruv va filtrlar.
  - Foydalanuvchi rolini o'zgartirish (`student` ➔ `admin`).
  - Foydalanuvchiga qo'lda Premium obuna berish yoki bekor qilish.
- **Natijalar va Tekshirish (Attempts & Submissions)**:
  - Talabalar topshirgan barcha testlar, insholar va speaking yozuvlarini ko'rish.
  - AI bergan bahoni ko'rish, kerak bo'lganda o'qituvchi tomonidan qo'lda qayta baholash (Manual regrading).
- **Tariflar va Kuponlar Boshqaruvi**: Yangi tarif paketlarini qo'shish, promo-kodlar yaratish va statistikasini kuzatish.
- **Lug'at Boshqaruvi**: Bazaga yangi so'zlar qo'shish, mavzularni tartibga solish.

---

## 🛠️ Texnologik Stek

### Frontend
- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 6](https://vitejs.dev/) (Tezkor HMR va optimallashtirilgan build)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + CSS Variables
- **UI & Komponentlar**: `@base-ui/react`, Radix UI, [Lucide React](https://lucide.dev/), Solar Icons
- **Animatsiyalar**: [Framer Motion](https://www.framer.com/motion/)
- **Grafiklar**: [Recharts](https://recharts.org/) (Radar chart, Bar chart, Area chart)
- **Routing**: [React Router DOM v7](https://reactrouter.com/)

### Backend
- **Platforma**: [Node.js](https://nodejs.org/) (ES Modules)
- **Framework**: [Express 4](https://expressjs.com/) + [TypeScript](https://www.typescriptlang.org/)
- **Runtime**: `tsx` (Watch va execution uchun)
- **Autentifikatsiya**: `jsonwebtoken` (JWT), `bcryptjs`
- **Fayllar**: `multer`, `@cloudinary/cloudinary` (Audio va rasmlarni bulutda saqlash)

### Ma'lumotlar Bazasi
- **RDBMS**: [PostgreSQL](https://www.postgresql.org/) (Relational Database)
- **Drayver**: `pg` (Node-Postgres connection pool)
- **Kengaytmalar**: `uuid-ossp`, `pgcrypto`

### Sun'iy Intellekt va Integratsiyalar
- **AI Engine**: Google Gemini API (`gemini-3.5-flash-lite`, `gemini-3.6-flash`, `gemini-flash-latest`)
- **To'lov Shlyuzi**: [InPay.uz API v2](https://inpay.uz/)
- **Bot**: Telegram Bot API + Telegram Login Widget
- **OAuth**: Google Identity Services

---

## 🗄️ Ma'lumotlar Bazasi Strukturasi

PostgreSQL bazasi rasmiy akademik ma'lumotlar yaxlitligini ta'minlash uchun chuqur indekslangan va munosabatlar bilan bog'langan:

```mermaid
erDiagram
    USERS ||--|| PROFILES : has
    USERS ||--o{ SUBSCRIPTIONS : purchases
    PLANS ||--o{ SUBSCRIPTIONS : defines
    USERS ||--o{ PAYMENTS : executes
    USERS ||--o{ TEST_ATTEMPTS : takes
    TESTS ||--o{ TEST_SECTIONS : contains
    TEST_SECTIONS ||--o{ QUESTION_GROUPS : groups
    QUESTION_GROUPS ||--o{ QUESTIONS : contains
    QUESTIONS ||--o{ QUESTION_OPTIONS : has
    TEST_ATTEMPTS ||--o{ ATTEMPT_ANSWERS : answers
    USERS ||--o{ WRITING_SUBMISSIONS : writes
    WRITING_SUBMISSIONS ||--|| WRITING_FEEDBACK : evaluates
    USERS ||--o{ SPEAKING_SUBMISSIONS : records
    SPEAKING_SUBMISSIONS ||--|| SPEAKING_FEEDBACK : evaluates
    USERS ||--o{ USER_VOCABULARY : studies
    VOCABULARY_WORDS ||--o{ USER_VOCABULARY : mapped
```

### Asosiy Jadvallar:
1. `users` & `profiles`: Foydalanuvchilar hisobi, rollar, parollar, maqsadli ball, telegram ID.
2. `plans`, `subscriptions`, `payments`, `coupons`: Obunalar, to'lovlar, kvitansiyalar va chegirma vaucherlari.
3. `tests`, `test_sections`, `question_groups`, `questions`, `question_options`: Mock testlarning to'liq ierarxik daraxti.
4. `reading_passages` & `listening_audio`: Matnlar va audio fayllar kutubxonasi.
5. `test_attempts`, `attempt_answers`, `section_scores`: Talabaning test urinishlari va bergan javoblari.
6. `writing_prompts`, `writing_submissions`, `writing_feedback`: Insholar, matnlar va AI bergan mezoniy ballar.
7. `speaking_prompts`, `speaking_submissions`, `speaking_feedback`: Ovozli javoblar, transkriptlar va AI baholari.
8. `vocabulary_words` & `user_vocabulary`: SRS tizimi orqali o'rganilayotgan so'zlar va takrorlash muddatlari.
9. `progress`, `saved_items`, `activity_logs`, `audit_logs`: Tizim faoliyati va foydalanuvchi yutuqlari.

---

## 📁 Loyiha Katalog Strukturasi

```text
foxford/
├── backend/                         # Express & TypeScript API serveri
│   ├── src/
│   │   ├── config/                  # DB va tashqi servislar konfiguratsiyasi
│   │   ├── db/                      # Schema.sql, init.ts, seed.sql
│   │   ├── middleware/              # Auth guard (authenticateToken, requireAdmin)
│   │   ├── routes/                  # API endpoints
│   │   │   ├── admin.ts             # Admin paneli (CRUD, statistika, import)
│   │   │   ├── auth.ts              # Kirish, ro'yxatdan o'tish, profil
│   │   │   ├── tests.ts             # Testlar ro'yxati, topshirish, avto-tekshirish
│   │   │   ├── subscriptions.ts     # InPay to'lovlar va obunalar
│   │   │   ├── vocabulary.ts        # So'zlar va SRS takrorlash
│   │   │   ├── progress.ts          # Analitika, radar chart ma'lumotlari
│   │   │   ├── saved.ts             # Saqlangan elementlar
│   │   │   ├── media.ts             # Cloudinary / Disk yuklashlari
│   │   │   └── telegram.ts          # Telegram bot va widget kirish
│   │   ├── services/                # InPay va Telegram bot xizmatlari
│   │   ├── utils/                   # Gemini AI va IELTS Grader algoritmlari
│   │   │   ├── gemini-evaluator.ts          # AI Writing examiner
│   │   │   ├── gemini-speaking-evaluator.ts # AI Speaking examiner
│   │   │   ├── gemini-html-parser.ts        # HTML/PDF test importer
│   │   │   └── ielts-grader.ts              # Reading & Listening baholash
│   │   └── server.ts                # Asosiy backend server fayli
│   ├── uploads/                     # Mahalliy media fayllar
│   └── package.json
│
├── frontend/                        # React 19 + Vite foydalanuvchi interfeysi
│   ├── src/
│   │   ├── app/                     # Ilova sahifalari (App router)
│   │   │   ├── (auth)/              # Login, Signup, Auth Callback
│   │   │   ├── (dashboard)/         # O'quvchi boshqaruv paneli
│   │   │   │   ├── dashboard/       # Bosh sahifa
│   │   │   │   ├── reading/         # Reading mashqlari
│   │   │   │   ├── listening/       # Listening mashqlari
│   │   │   │   ├── writing/         # Writing mashqlari
│   │   │   │   ├── speaking/        # Speaking mashqlari
│   │   │   │   ├── vocabulary/      # SRS Lug'at va Review rejimi
│   │   │   │   ├── progress/        # Analitika va statistik grafiklar
│   │   │   │   └── premium/         # Obuna tariflari va to'lov
│   │   │   ├── (marketing)/         # Landing sahifalar, About, Privacy
│   │   │   ├── (onboarding)/        # Dastlabki maqsadni belgilash
│   │   │   ├── (tests)/             # CD-IELTS to'liq ekranli test rejimi
│   │   │   │   ├── reading/[id]/    # Reading test oynasi (Split-screen)
│   │   │   │   ├── listening/[id]/  # Listening test oynasi (Audio sync)
│   │   │   │   ├── writing/[id]/    # Writing test oynasi (AI scoring)
│   │   │   │   └── speaking/[id]/   # Speaking test oynasi (Voice recorder)
│   │   │   └── admin/               # Administrator paneli
│   │   ├── components/              # Qayta ishlatiluvchi UI komponentlar
│   │   │   ├── tests/               # Test pleyeri, passage view, highlighter
│   │   │   ├── dashboard/           # Sidebar, header, stats kartalar
│   │   │   ├── vocabulary/          # Flashcard, review modal
│   │   │   └── mascot/              # Tulki maskoti animatsiyalari
│   │   ├── router.tsx               # Marshrutlar taqsimoti
│   │   └── main.tsx
│   ├── public/                      # Statik resurslar, SVG piktogrammalar
│   └── package.json
│
├── scripts/                         # Ma'lumotlar migratsiyasi va import skriptlari
├── Dockerfile                       # Konteynerizatsiya uchun multi-stage Dockerfile
├── dev.bat                          # Windows uchun tezkor ishga tushirish skripti
└── package.json                     # Monorepo boshqaruv konfiguratsiyasi
```

---

## 💻 O'rnatish va Ishga Tushirish

### Talablar

Loyihani o'rnatishdan oldin tizimingizda quyidagilar mavjudligiga ishonch hosil qiling:
- **Node.js**: v18.0 yoki undan yuqori (v20+ tavsiya etiladi)
- **npm** yoki **pnpm**
- **PostgreSQL**: v14 yoki undan yuqori

---

### Muhit O'zgaruvchilari (.env)

Loyihada backend va frontend uchun alohida `.env` konfiguratsiya talab etiladi.

#### 1. Backend Konfiguratsiyasi (`backend/.env`):

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173,http://localhost:3000

# PostgreSQL ulanish manzili
DATABASE_URL=postgresql://postgres:parol@localhost:5432/foxford

# JWT maxfiy kaliti
JWT_SECRET=maxfiy-jwt-kaliti-2026

# Administrator hisobi (db:init da avtomatik yaratiladi)
ADMIN_EMAIL=admin@edufox.uz
ADMIN_PASSWORD=AdminPassword123!

# Google Gemini AI Kaliti (Writing va Speaking tekshirish uchun zarur)
GEMINI_API_KEY=sizning_gemini_api_kalitingiz

# Cloudinary (Fayllarni bulutda saqlash uchun)
CLOUDINARY_CLOUD_NAME=sizning_cloud_nomingiz
CLOUDINARY_API_KEY=sizning_api_kalitingiz
CLOUDINARY_API_SECRET=sizning_api_maxfiy_kalitingiz

# Telegram Bot sozlamalari
TELEGRAM_BOT_TOKEN=bot_tokeningiz
TELEGRAM_BOT_USERNAME=edu_foxbot

# InPay To'lov Tizimi sozlamalari
INPAY_BASE_URL=https://inpay.uz/api/v2
INPAY_MERCHANT_ID=sizning_merchant_id
INPAY_MERCHANT_TOKEN=sizning_tokeningiz
INPAY_TEST_SECRET_KEY=test_kalit
INPAY_LIVE_SECRET_KEY=live_kalit
INPAY_ENV=live
```

#### 2. Frontend Konfiguratsiyasi (`frontend/.env.local`):

```env
VITE_API_URL=http://localhost:5000
VITE_APP_URL=http://localhost:5173
VITE_TELEGRAM_BOT_USERNAME=edu_foxbot
VITE_GOOGLE_CLIENT_ID=google_client_id.apps.googleusercontent.com
```

---

### Ma'lumotlar Bazasini Initsializatsiya Qilish

PostgreSQL serveringiz ishga tushirilgach, ma'lumotlar bazasini yarating (masalan, `foxford`) va quyidagi buyruqni bering:

```bash
# 1. Monorepo va barcha qismlar kutubxonalarini o'rnatish
npm run install:all

# 2. Baza jadvallarini yaratish va boshlang'ich ma'lumotlarni kiritish (Admin ham yaratiladi)
npm run db:init

# 3. Speaking bo'limi uchun 50 ta namunaviy savollar bazasini yuklash
npm run seed:speaking
```

---

### Dasturni Ishga Tushirish

Barcha qismlarni bir vaqtda (concurrently) ishga tushirish uchun:

```bash
# Frontend va Backend'ni parallel ishga tushirish
npm run dev
```

Alohida ishga tushirish kerak bo'lsa:
```bash
# Faqat Backend serverini ishga tushirish (Port: 5000)
npm run dev:backend

# Faqat Frontend loyihasini ishga tushirish (Port: 5173)
npm run dev:frontend
```

Brauzeringizda oching:
- **Foydalanuvchi interfeysi**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000/api`

---

### Docker orqali Ishga Tushirish

Loyiha tayyor ko'p bosqichli `Dockerfile` bilan ta'minlangan:

```bash
# 1. Docker obrazini qurish
docker build -t foxford-platform .

# 2. Konteynerni ishga tushirish
docker run -p 10000:10000 --env-file backend/.env foxford-platform
```

---

## 📡 API Marshrutlari Xaritasi

| Metod | Marshrut | Tavsif | Kirish huquqi |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Yangi o'quvchi ro'yxatdan o'tkazish | Ochiq |
| **POST** | `/api/auth/login` | Email va parol bilan tizimga kirish | Ochiq |
| **POST** | `/api/auth/google` | Google OAuth orqali kirish | Ochiq |
| **GET** | `/api/auth/me` | Joriy foydalanuvchi profili va roli | Foydalanuvchi |
| **GET** | `/api/tests` | Barcha e'lon qilingan testlar ro'yxati | Ochiq / Foydalanuvchi |
| **GET** | `/api/tests/:id` | Testning to'liq tuzilishi (Passages, Questions) | Foydalanuvchi |
| **POST** | `/api/tests/submit` | Reading / Listening testini topshirish va baholash | Foydalanuvchi |
| **POST** | `/api/tests/writing/submit` | Writing inshosini yuborish va Gemini AI tekshiruvi | Foydalanuvchi |
| **POST** | `/api/tests/speaking/submit`| Speaking audiosini yuborish va Gemini AI tekshiruvi | Foydalanuvchi |
| **GET** | `/api/vocabulary` | O'quvchi so'zlar ro'yxati va holati | Foydalanuvchi |
| **POST** | `/api/vocabulary/review` | SRS oraliqli takrorlash bahosini saqlash | Foydalanuvchi |
| **GET** | `/api/progress` | Radar diagrammasi va 30 kunlik faollik analitikasi | Foydalanuvchi |
| **POST** | `/api/subscriptions/create`| InPay orqali obuna to'lovini shakllantirish | Foydalanuvchi |
| **POST** | `/api/subscriptions/coupon`| Promo-kodni tekshirish va chegirma hisoblash | Foydalanuvchi |
| **POST** | `/api/media/upload` | Rasm yoki audio yuklash (Cloudinary / Disk) | Foydalanuvchi |
| **GET** | `/api/admin/stats` | Admin panelining umumiy statistikasi | Faqat Admin |
| **POST** | `/api/admin/tests` | Yangi test yaratish | Faqat Admin |
| **POST** | `/api/admin/import/html` | Cambridge HTML faylini AI orqali testga aylantirish | Faqat Admin |
| **POST** | `/api/admin/import/pdf` | PDF fayldan test yaratish | Faqat Admin |
| **GET** | `/api/admin/users` | Foydalanuvchilar ro'yxati va tahrirlash | Faqat Admin |

---

## 🔒 Xavfsizlik va Ishlash Samaradorligi

- **Xavfsiz Autentifikatsiya**: Parollar `bcryptjs` ning 10 ta tuzlash davri bilan shifrlangan. Barcha sessiyalar muddati belgilangan JWT tokenlari orqali boshqariladi.
- **Rollar Nazorati (RBAC)**: Talaba va Administrator huquqlari server darajasidagi `authenticateToken` va `requireAdmin` middleware orqali qat'iy himoyalangan.
- **Xatolarga Chidamli AI Kaskadi**: Gemini API chaqiruvlarida bir nechta model kaskadlari (`gemini-3.5-flash-lite`, `gemini-3.6-flash`, `gemini-flash-latest`) qo'llaniladi. Bitta model band bo'lsa, tizim ikkinchisiga avtomatik o'tadi.
- **Optimizatsiyalangan SQL**: Ma'lumotlar bazasining barcha asosiy maydonlari (`user_id`, `test_id`, `status`, `next_review_at`) bo'yicha indekslar o'rnatilgan bo'lib, o'n minglab urinishlarda ham tezkor javob qaytaradi.
- **Media CDN Integratsiyasi**: Katta hajmdagi tinglash audio treklari va rasmlar Cloudinary CDN orqali tezkor keshlanadi.

---

## 📄 Litsenziya

Ushbu dasturiy ta'minot mualliflik huquqi bilan himoyalangan. Barcha huquqlar EduFox jamoasiga tegishli.

<p align="center">
  Made with ❤️ by <strong>Ilyos Khudayberganov</strong>
</p>
