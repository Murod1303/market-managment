export function getMainKeyboard(isAuth: boolean = false) {
  if (isAuth) {
    return {
      keyboard: [
        [{ text: '📦 Tovarlar' }, { text: '💰 Kassa' }],
        [{ text: '📊 Statistika' }, { text: '📝 Hisobot' }],
        [{ text: '➕ Yangi tovar (/new)' }, { text: '❓ Yordam' }],
      ],
      resize_keyboard: true,
      persistent: true,
    };
  }

  return {
    keyboard: [
      [{ text: '🔑 Tizimga kirish (/login)' }],
      [{ text: '❓ Yordam' }, { text: '📦 Tovarlar' }],
    ],
    resize_keyboard: true,
    persistent: true,
  };
}

export function getMarkupSelectionKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '+10%', callback_data: 'markup_10' },
        { text: '+15%', callback_data: 'markup_15' },
        { text: '+20%', callback_data: 'markup_20' },
      ],
      [
        { text: '+25%', callback_data: 'markup_25' },
        { text: '+30%', callback_data: 'markup_30' },
        { text: '+35%', callback_data: 'markup_35' },
      ],
      [
        { text: '+40%', callback_data: 'markup_40' },
        { text: '+50%', callback_data: 'markup_50' },
      ],
    ],
  };
}
