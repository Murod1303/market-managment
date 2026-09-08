# Loyiha Xavfsizligi Qoidalari (Security Rules)

Ushbu hujjat loyihada xavfsizlikni ta'minlash uchun asosiy qoidalarni har biri **nima uchun kerakligi** bilan birga tushuntiradi.

---

## 1. Maxfiy ma'lumotlar (Secrets Management)

**Qoida:** API kalitlar, parollar, tokenlar, database ulanish satrlari hech qachon kodga to'g'ridan-to'g'ri yozilmasin.

**Nima uchun:** Agar secret kodga yozilsa va Git repozitoriyga push qilinsa, u butun tarix bo'ylab saqlanib qoladi — hatto keyin o'chirilsa ham, eski commit'larda qolib ketadi. Hujumchilar GitHub'ni avtomatik skanerlab, ochiq qolgan API kalitlarni qidiradi.

**Qanday qilish kerak:**
- `.env` fayl yarating va uni albatta `.gitignore`ga qo'shing
- `.env.example` fayl orqali qaysi o'zgaruvchilar kerakligini ko'rsating (qiymatlarsiz)
- Production'da secret manager ishlating: AWS Secrets Manager, HashiCorp Vault, Google Secret Manager
- `git-secrets` yoki `trufflehog` kabi vositalar bilan commit qilishdan oldin tekshiring

---

## 2. Kirish ma'lumotlarini tekshirish (Input Validation)

**Qoida:** Foydalanuvchidan yoki tashqi manbadan kelgan har qanday ma'lumot ishonchsiz deb hisoblansin va tekshirilsin.

**Nima uchun:** Tekshirilmagan input orqali SQL Injection, XSS, Command Injection kabi hujumlar amalga oshiriladi. Bu eng ko'p uchraydigan zaifliklardan biri (OWASP Top 10'da doimo birinchi o'rinlarda).

**Qanday qilish kerak:**
- SQL so'rovlarda faqat **parametrlangan so'rovlar (prepared statements)** ishlating, hech qachon string concatenation qilmang
- Har bir input uchun tur, uzunlik, format tekshiruvini o'rnating (masalan, Zod, Joi, Pydantic)
- HTML chiqishida foydalanuvchi ma'lumotini avtomatik escape qiladigan freymvorklardan foydalaning (React, Vue kabi)
- Fayl yuklashda fayl turini, hajmini va nomini tekshiring

---

## 3. Autentifikatsiya va avtorizatsiya

**Qoida:** "Kim ekaningizni tasdiqlash" (authentication) va "nimaga ruxsatingiz borligi" (authorization) alohida va qattiq nazorat qilinsin.

**Nima uchun:** Bu ikkisi aralashtirilsa, foydalanuvchi boshqa birovning ma'lumotiga yoki admin funksiyalariga kirishi mumkin (masalan, faqat `user_id`ni URL'da o'zgartirib).

**Qanday qilish kerak:**
- Parollarni **bcrypt** yoki **argon2** bilan hashlang, hech qachon MD5/SHA1 ishlatmang
- Har bir himoyalangan endpoint'da avtorizatsiyani serverda tekshiring (frontend tekshiruvi yetarli emas)
- JWT tokenlarga qisqa muddat (expiry) belgilang va refresh token mexanizmini qo'llang
- Sessiya cookie'larida `HttpOnly`, `Secure`, `SameSite` flag'larini o'rnating

---

## 4. Bog'liqliklar (Dependencies) xavfsizligi

**Qoida:** Loyihada ishlatilayotgan barcha kutubxonalar muntazam yangilanib va zaifliklarga tekshirilib turilsin.

**Nima uchun:** Ko'pchilik hujumlar to'g'ridan-to'g'ri sizning kodingizdan emas, balki eskirgan, zaif uchinchi tomon kutubxonalardan kiradi.

**Qanday qilish kerak:**
- `npm audit`, `pip-audit`, yoki `cargo audit` kabi vositalarni CI/CD pipeline'ga qo'shing
- Dependabot yoki Renovate kabi avtomatik yangilash botlaridan foydalaning
- Ishlatilmayotgan kutubxonalarni o'chirib tashlang (attack surface kamayadi)

---

## 5. Tarmoq xavfsizligi

**Qoida:** Barcha aloqa shifrlangan bo'lsin va faqat kerakli portlar/manzillar ochiq bo'lsin.

**Qanday qilish kerak:**
- Faqat HTTPS (TLS 1.2+) orqali ishlang, HTTP so'rovlarini HTTPS'ga yo'naltiring
- CORS sozlamalarida `*` o'rniga faqat kerakli domenlarni ko'rsating
- Rate limiting o'rnating (masalan, login endpoint'ga 1 daqiqada 5 ta urinish) — brute-force hujumlardan himoya
- Firewall qoidalarida faqat zarur portlarni oching (80, 443 va h.k.)

---

## 6. Xatoliklar va loglash (Error Handling & Logging)

**Qoida:** Xatoliklar to'g'ri qayd qilinsin, lekin foydalanuvchiga texnik tafsilotlar ko'rsatilmasin.

**Nima uchun:** Batafsil xato xabarlari (stack trace, database struktura) hujumchiga tizim haqida qimmatli ma'lumot beradi.

**Qanday qilish kerak:**
- Production'da umumiy xato xabarlarini ko'rsating ("Xatolik yuz berdi"), tafsilotlarni faqat serverda loglang
- Loglarga parol, token kabi maxfiy ma'lumotlarni yozmang
- Sentry, Grafana, Datadog kabi monitoring vositalaridan foydalaning

---

## 7. Muhitlarni ajratish

**Qoida:** Development, staging va production muhitlari bir-biridan to'liq ajratilgan bo'lsin.

**Qanday qilish kerak:**
- Har bir muhit uchun alohida database va secret'lar ishlating
- Production ma'lumotlarini test uchun ishlatmang (real foydalanuvchi ma'lumotlarini himoya qilish uchun)
- CI/CD'da deploy huquqlarini cheklang (faqat ma'lum shaxslar production'ga deploy qila olsin)

---

## 8. Kod review va CI/CD xavfsizligi

**Qoida:** Har bir kod o'zgarishi merge qilinishidan oldin ko'rib chiqilsin va avtomatik tekshiruvlardan o'tsin.

**Qanday qilish kerak:**
- Pull request'larda kamida 1 kishi tomonidan review majburiy bo'lsin
- CI pipeline'da statik kod tahlili (SAST) vositalarini ishga tushiring: SonarQube, Semgrep, ESLint security plugin
- `main`/`master` branch'ga to'g'ridan-to'g'ri push taqiqlansin

---

## Tezkor tekshirish ro'yxati (Checklist)

- [ ] `.env` fayl `.gitignore`da bormi?
- [ ] Barcha SQL so'rovlar parametrlanganmi?
- [ ] Parollar hashlanganmi (bcrypt/argon2)?
- [ ] HTTPS majburiymi?
- [ ] Rate limiting o'rnatilganmi?
- [ ] Dependencies audit qilib turilmi?
- [ ] Xato xabarlari maxfiy ma'lumot chiqarmayaptimi?
- [ ] CORS to'g'ri sozlanganmi?
- [ ] Production va dev muhitlari ajratilganmi?