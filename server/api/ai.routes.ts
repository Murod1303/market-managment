import { Router, Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import { env } from '../config/env.ts';

const router = Router();

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

router.post('/scan-receipt', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;

    if (!imageBase64) {
      res.status(400).json({ error: 'Rasm yuborilmadi (imageBase64 talab qilinadi)' });
      return;
    }

    const cleanBase64 = imageBase64.includes('base64,')
      ? imageBase64.split('base64,')[1]
      : imageBase64;

    const ai = getGeminiClient();

    if (!ai) {
      console.warn('GEMINI_API_KEY mavjud emas, namunaviy tovarlar qaytarilmoqda');
      res.json({
        result: {
          supplier: 'Agro Savdo Baraka MCHJ',
          date: new Date().toISOString().split('T')[0],
          invoiceNumber: 'SF-' + Math.floor(10000 + Math.random() * 90000),
          items: [
            {
              name: 'Osh tuzi (Iodlangan)',
              category: 'Oziq-ovqat',
              quantity: 100,
              unit: 'pachka',
              unitCost: 2500,
              totalCost: 250000,
            },
            {
              name: 'Makaron (Makfa 400g)',
              category: 'Oziq-ovqat',
              quantity: 60,
              unit: 'dona',
              unitCost: 9000,
              totalCost: 540000,
            },
            {
              name: 'Tomat pastasi (Pomidor 850g)',
              category: 'Oziq-ovqat',
              quantity: 40,
              unit: 'banka',
              unitCost: 17500,
              totalCost: 700000,
            },
          ],
          totalInvoiceAmount: 1490000,
          notes: "AI demo rejimida hisob-faktura ma'lumotlari shakllantirildi.",
        },
      });
      return;
    }

    const prompt = `Siz savdo do'koni hisobchisi va hisob-faktura (nakladnoy/chek) skanerisiz.
Ushbu rasmda ko'rsatilgan hisob-faktura yoki tovar chekini to'liq tahlil qiling.
Har bir kelgan tovar nomi (O'zbek yoki Rus tilida), uning o'lchov birligi (kg, dona, litr, qop, quti, pachka, banka va h.k.), miqdori, 1 birlik tannarxi (kelish narxi), jami summasi, ta'minotchi (supplier) nomi va sana (YYYY-MM-DD) ma'lumotlarini aniq ajrating.
Barcha narxlar va miqdorlar faqat raqam bo'lsin.
Agar ma'lumot noaniq bo'lsa, mantiqiy taxmin qiling.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            supplier: {
              type: Type.STRING,
              description: "Ta'minotchi tashkilot yoki do'kon nomi",
            },
            date: {
              type: Type.STRING,
              description: 'Faktura sanasi (YYYY-MM-DD)',
            },
            invoiceNumber: {
              type: Type.STRING,
              description: 'Faktura yoki chek raqami',
            },
            totalInvoiceAmount: {
              type: Type.NUMBER,
              description: 'Fakturaning umumiy jami summasi',
            },
            notes: {
              type: Type.STRING,
              description: "Qo'shimcha izoh yoki xulosa",
            },
            items: {
              type: Type.ARRAY,
              description: "Kelgan tovarlar ro'yxati",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: {
                    type: Type.STRING,
                    description: 'Tovar nomi',
                  },
                  category: {
                    type: Type.STRING,
                    description: "Tovar kategoriyasi (masalan: Oziq-ovqat, Ichimliklar, Meva-Sabzavot, Sut mahsulotlari, Xo'jalik)",
                  },
                  quantity: {
                    type: Type.NUMBER,
                    description: 'Kelgan tovar miqdori',
                  },
                  unit: {
                    type: Type.STRING,
                    description: 'Birligi (kg, dona, litr, qop, quti, pachka, banka)',
                  },
                  unitCost: {
                    type: Type.NUMBER,
                    description: "1 birlik tannarxi so'mda",
                  },
                  totalCost: {
                    type: Type.NUMBER,
                    description: 'Jami tovar summasi (miqdor * narx)',
                  },
                },
                required: ['name', 'quantity', 'unit', 'unitCost'],
              },
            },
          },
          required: ['supplier', 'items'],
        },
      },
    });

    const parsedJson = JSON.parse(response.text || '{}');
    res.json({ result: parsedJson });
  } catch (error: any) {
    console.error('Gemini Vision Scanner Error:', error);
    res.status(500).json({
      error: 'Rasm tahlil qilishda xatolik yuz berdi: ' + (error.message || "Noma'lum xatolik"),
    });
  }
});

export default router;
