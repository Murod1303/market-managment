import { ParsedProductResult } from '../types/index.ts';

export function formatSom(amount: number): string {
  return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + " so'm";
}

export function parseNewProductInput(raw: string): ParsedProductResult {
  const text = raw.trim();
  if (!text || text.toLowerCase() === 'help' || text.toLowerCase() === 'yordam') {
    return { success: false, error: 'empty' };
  }

  let name = '';
  let quantity = 0;
  let unit = 'dona';
  let unitCost = 0;
  let markupPercent = 20; // default 20%
  let category = 'Umumiy';
  let supplier = "Do'kon ombori";

  if (text.includes('\n') && (text.toLowerCase().includes('nomi:') || text.toLowerCase().includes('tovar:'))) {
    const lines = text.split('\n');
    for (const line of lines) {
      const lower = line.toLowerCase().trim();
      if (lower.startsWith('nomi:') || lower.startsWith('tovar:')) {
        name = line.split(':')[1]?.trim() || '';
      } else if (lower.startsWith('miqdor:') || lower.startsWith('miqdori:')) {
        const val = line.split(':')[1]?.trim() || '';
        const match = val.match(/([\d\.]+)\s*([a-zA-Zа-яА-ЯўқғҳЎҚҒҲ']+)?/);
        if (match) {
          quantity = parseFloat(match[1]) || 0;
          if (match[2]) unit = match[2].toLowerCase();
        }
      } else if (lower.startsWith('birligi:') || lower.startsWith('birlik:')) {
        unit = line.split(':')[1]?.trim().toLowerCase() || unit;
      } else if (lower.startsWith('tannarx:') || lower.startsWith('tannarxi:') || lower.startsWith('narx:')) {
        const val = line.split(':')[1]?.replace(/[^\d\.]/g, '') || '';
        unitCost = parseFloat(val) || 0;
      } else if (lower.startsWith('ustama:') || lower.startsWith('foiz:')) {
        const val = line.split(':')[1]?.replace(/[^\d\.]/g, '') || '';
        markupPercent = parseFloat(val) || 20;
      } else if (lower.startsWith("ta'minotchi:") || lower.startsWith('taminotchi:')) {
        supplier = line.split(':')[1]?.trim() || supplier;
      }
    }
  } else if (text.includes(',') || text.includes('|') || text.includes(';')) {
    const parts = text.split(/[,|;]+/).map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      name = parts[0];
      const p1 = parts[1];
      const qMatch = p1.match(/([\d\.]+)\s*([a-zA-Zа-яА-ЯўқғҳЎҚҒҲ']+)?/);
      if (qMatch) {
        quantity = parseFloat(qMatch[1]) || 0;
        if (qMatch[2]) unit = qMatch[2].toLowerCase();
      }

      let costPartIndex = 2;
      if (parts[2] && isNaN(parseFloat(parts[2].replace(/[^\d\.]/g, '')))) {
        unit = parts[2].toLowerCase();
        costPartIndex = 3;
      }

      if (parts[costPartIndex]) {
        unitCost = parseFloat(parts[costPartIndex].replace(/[^\d\.]/g, '')) || 0;
      }

      const markupPartIndex = costPartIndex + 1;
      if (parts[markupPartIndex]) {
        const parsedMarkup = parseFloat(parts[markupPartIndex].replace(/[^\d\.]/g, ''));
        if (!isNaN(parsedMarkup)) {
          markupPercent = parsedMarkup;
        }
      }
    }
  } else {
    const words = text.split(/\s+/);
    const nums: Array<{ val: number; index: number }> = [];
    words.forEach((w, i) => {
      const cleaned = w.replace(/[^\d\.]/g, '');
      const num = parseFloat(cleaned);
      if (!isNaN(num) && num > 0) {
        nums.push({ val: num, index: i });
      }
    });

    if (nums.length >= 2) {
      const qNum = nums[0];
      const cNum = nums[1];

      name = words.slice(0, qNum.index).join(' ');

      quantity = qNum.val;
      if (cNum.index > qNum.index + 1) {
        unit = words.slice(qNum.index + 1, cNum.index).join(' ').toLowerCase();
      }

      unitCost = cNum.val;

      if (nums.length >= 3 && nums[2].index > cNum.index) {
        markupPercent = nums[2].val;
      }
    } else {
      return { success: false, error: 'invalid' };
    }
  }

  if (!name || quantity <= 0 || unitCost <= 0) {
    return { success: false, error: 'invalid' };
  }

  const lowerName = name.toLowerCase();
  if (lowerName.includes('shakar') || lowerName.includes('yog') || lowerName.includes('un') || lowerName.includes('guruch') || lowerName.includes('tuxum') || lowerName.includes('choy')) {
    category = 'Oziq-ovqat';
  } else if (lowerName.includes('olma') || lowerName.includes('kartoshka') || lowerName.includes('piyoz') || lowerName.includes('sabzi') || lowerName.includes('pomidor') || lowerName.includes('bodring')) {
    category = 'Meva-Sabzavot';
  } else if (lowerName.includes('sut') || lowerName.includes('qatiq') || lowerName.includes('pishloq') || lowerName.includes('tvorog') || lowerName.includes('qaymoq')) {
    category = 'Sut mahsulotlari';
  } else if (lowerName.includes('cola') || lowerName.includes('fanta') || lowerName.includes('suv') || lowerName.includes('sharbat') || lowerName.includes('pepsi')) {
    category = 'Ichimliklar';
  } else if (lowerName.includes('sovun') || lowerName.includes('poroshok') || lowerName.includes('shampun') || lowerName.includes('pasta')) {
    category = "Xo'jalik mollari";
  }

  return {
    success: true,
    item: {
      name,
      quantity,
      unit: unit || 'dona',
      unitCost,
      markupPercent: Math.max(0, Math.round(markupPercent)),
      category,
      supplier,
    },
  };
}
