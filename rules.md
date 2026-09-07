# AI Coding Assistant uchun Qoidalar (Project Rules)

Bu fayl AI kod yozuvchi assistentlar (Cursor, Claude Code, Copilot va h.k.) uchun loyihaning
struktura va kod yozish qoidalarini belgilaydi. Maqsad — kodni tartibli, kengaytiriladigan
va bir papkaga hammasini tiqmaydigan qilib yozish.

---

## 1. Umumiy tamoyil

- **Bitta faylga / bitta papkaga hamma narsani yozish taqiqlanadi.** Har bir modul, funksiya
  yoki qatlam (layer) o'ziga mos joyda bo'lishi kerak.
- Har bir fayl **bitta mas'uliyatga** ega bo'lishi kerak (Single Responsibility Principle).
- Fayl hajmi katta bo'lib ketsa (odatda 200–300 qatordan oshsa), uni kichikroq modullarga bo'lish kerak.
- Kod **feature-based** yoki **layer-based** tuzilmada tashkil qilinadi (loyihaga qarab, lekin ikkisi
  ham "hammasi bitta joyda" bo'lishiga yo'l qo'ymaydi).

---

## 2. Standart papka strukturasi (backend, Node.js/Express misolida)

```
project-root/
├── src/
│   ├── config/            # env, database, third-party config'lar
│   │   ├── env.js
│   │   └── db.js
│   ├── api/                # HTTP layer — routelar shu yerda
│   │   ├── v1/
│   │   │   ├── users/
│   │   │   │   ├── users.routes.js
│   │   │   │   ├── users.controller.js
│   │   │   │   ├── users.validation.js
│   │   │   │   └── users.service.js
│   │   │   └── orders/
│   │   │       ├── orders.routes.js
│   │   │       ├── orders.controller.js
│   │   │       └── orders.service.js
│   │   └── index.js        # barcha routelarni yig'ib beruvchi fayl
│   ├── services/            # biznes logika (agar controllerdan alohida bo'lsa)
│   ├── repositories/        # DB bilan ishlovchi qatlam (Prisma/Sequelize/Mongoose so'rovlari)
│   ├── models/               # DB modellari / sxemalar
│   ├── integrations/         # tashqi APIlar bilan ishlash (pastda batafsil)
│   │   ├── payme/
│   │   │   ├── payme.client.js
│   │   │   └── payme.types.js
│   │   └── telegram/
│   │       └── telegram.client.js
│   ├── middlewares/           # auth, error-handler, logger va h.k.
│   ├── utils/                  # umumiy yordamchi funksiyalar
│   ├── errors/                  # custom error klasslari
│   └── app.js                    # Express app yaratish
├── tests/
│   ├── unit/
│   └── integration/
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

**Qoida:** `routes` → `controller` → `service` → `repository` — har bir qatlam faqat
o'zidan keyingi qatlam bilan gaplashadi. Controller to'g'ridan-to'g'ri DB bilan ishlamaydi.

---

## 3. Frontend uchun (React/Next.js misolida)

```
src/
├── app/ yoki pages/         # routing
├── components/
│   ├── ui/                  # button, input kabi umumiy komponentlar
│   └── features/            # feature-ga xos komponentlar (masalan cart/, profile/)
├── hooks/                    # custom hook'lar
├── services/ yoki api/        # backend bilan bog'lanish (pastga qarang)
│   ├── httpClient.js          # axios/fetch instansiyasi (bitta joyda)
│   ├── auth.api.js
│   ├── users.api.js
│   └── orders.api.js
├── store/                      # Redux/Zustand kabi state boshqaruvi
├── types/                       # TypeScript type'lar
├── utils/
└── constants/
```

---

## 4. Tashqi APIlar bilan ishlash — alohida qatlam sifatida

**Muammo:** ko'p loyihalarda `fetch('https://api...')` yoki `axios.get(...)` chaqiruvlari
komponent yoki controller ichiga to'g'ridan-to'g'ri yozilib qoladi. Bu tartibsizlikka olib keladi.

**Qoida:**

1. Har bir tashqi servis (Payme, Click, Telegram, Google Maps va h.k.) uchun **alohida modul**
   yarating: `integrations/<servis-nomi>/` yoki `api/<servis-nomi>/`.
2. Har bir modulda kamida:
   - `*.client.js` — HTTP klient (base URL, headers, timeout, auth token qo'shish).
   - `*.types.js` yoki `*.dto.js` — javob/so'rov strukturasi.
   - Kerak bo'lsa `*.mapper.js` — tashqi API javobini ichki formatga o'girish.
3. **Bitta umumiy HTTP klient** yarating (`httpClient.js` / `apiClient.js`), unda:
   - base URL
   - interceptor (token qo'shish, xatolarni ushlash)
   - retry/timeout logikasi
   Har bir servis shu klientdan foydalanadi, o'zidan qayta yozmaydi.
4. **API kalitlari va sirlar hech qachon kodda hardcode qilinmaydi** — faqat `.env` orqali,
   `config/env.js` orqali o'qiladi.
5. Controller/komponent tashqi APIni bevosita chaqirmaydi — u faqat `service` yoki
   `integrations` qatlamini chaqiradi.

**Misol:**

```js
// integrations/payme/payme.client.js
import { httpClient } from '../../config/httpClient.js';

export const paymeClient = httpClient.create({
  baseURL: process.env.PAYME_BASE_URL,
  headers: { Authorization: `Basic ${process.env.PAYME_KEY}` },
});

export async function createTransaction(data) {
  const res = await paymeClient.post('/transactions', data);
  return res.data;
}
```

```js
// api/orders/orders.service.js
import { createTransaction } from '../../integrations/payme/payme.client.js';

export async function payOrder(orderId) {
  // biznes logika shu yerda, Payme detallari servis ichida yashiringan
  return createTransaction({ orderId });
}
```

---

## 5. Nomlash qoidalari (naming conventions)

- Fayllar: `kebab-case` yoki `camelCase` — loyiha bo'yicha bitta standartga rioya qiling.
- Komponent fayllari: `PascalCase.jsx` (React uchun).
- Har bir fayl nomi uning mazmunini aniq ifodalashi kerak: `users.service.js`, emas `helper2.js`.
- Bir xil turdagi fayllar bir xil suffiks olishi kerak: `.routes.js`, `.controller.js`,
  `.service.js`, `.client.js`, `.types.js`.

---

## 6. Xatoliklarni boshqarish

- Har bir loyihada markazlashgan `errors/` papkasi va global `error-handler` middleware bo'lishi kerak.
- Tashqi API xatolari (`try/catch`) o'sha integratsiya qatlamida ushlanadi va aniq xato turi
  bilan yuqoriga uzatiladi (masalan `PaymeError`, `ValidationError`).

---

## 7. Umumiy AI uchun ko'rsatma (qisqacha)

Kod yozayotganda AI quyidagilarga rioya qilishi shart:

1. Yangi funksionallik qo'shishdan oldin, mavjud papka strukturasiga qarab, kodni qayerga
   qo'yish kerakligini aniqlang — hammasini bitta faylga yozmang.
2. Tashqi API bilan ishlashda alohida `integrations/` yoki `api/` modul yarating, uni
   controller/komponentdan ajrating.
3. Bir xil logikani takrorlamang — umumiy narsalarni `utils/` yoki `services/` ga chiqaring.
4. Har doim environment o'zgaruvchilarini `.env` orqali oling, hech qachon kod ichiga yozmang.
5. Katta fayl yaratilsa (200+ qator), uni bo'lish kerakligini eslatib o'ting yoki avtomatik bo'ling.
6. Yangi fayl yaratishdan oldin, mavjud shunga o'xshash modulni tekshiring — duplikatsiyadan saqlaning.

---

Bu faylni loyihangiz root papkasiga `.cursorrules`, `CLAUDE.md` yoki `AI_RULES.md` nomi bilan
saqlab, AI kod yozuvchi vositalaringizga (Cursor, Claude Code va h.k.) qo'llanma sifatida bering.