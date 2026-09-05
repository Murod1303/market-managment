export type Language = 'uz-latn' | 'uz-cyrl';

export interface Translations {
  // Brand & Header
  brandTitle: string;
  brandSubtitle: string;
  aiVision: string;
  webAppTitle: string;
  webAppSubtitle: string;
  authorized: string;
  securityCheck: string;
  loadingAuth: string;
  logout: string;
  logoutTooltip: string;
  logoutSuccess: string;
  welcome: string;
  currency: string;

  // Header Nav & Actions
  searchBtn: string;
  aiScannerBtn: string;
  scannerShort: string;
  newProductBtn: string;
  excelBtn: string;
  statsPdfBtn: string;
  telegramBotBtn: string;
  webAppViewTooltip: string;
  backToNormalView: string;
  menuTitle: string;
  quickActionsMenu: string;
  closeMenu: string;

  // Product Details Modal
  productDetailsTitle: string;
  productDetailsSubtitle: string;
  unitProfit: string;
  stockStatus: string;
  stockSufficient: string;
  stockLow: string;
  stockOut: string;
  quickSalesCalc: string;
  calcIfSold: string;
  calcTotalPay: string;
  calcNetProfit: string;
  copyInfoBtn: string;
  copiedSuccess: string;
  priceTagPreview: string;
  skuCode: string;
  clickRowNotice: string;
  estimatedRevenue: string;
  deleteConfirmTitle: string;
  deleteConfirmDesc: string;
  deleteProductConfirmBtn: string;

  // Login Screen
  loginTitle: string;
  loginSubtitle: string;
  loginRequiredNotice: string;
  usernameLabel: string;
  usernamePlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  submitLogin: string;
  submittingLogin: string;
  quickAccounts: string;
  adminRole: string;
  managerRole: string;
  cashierRole: string;
  secureAccessNote: string;
  loginErrorMissing: string;

  // KPI Cards
  kpiTotalCost: string;
  kpiTotalRevenue: string;
  kpiTotalProfit: string;
  kpiAvgMarkup: string;
  itemsInStock: string;
  fullTurnoverDesc: string;
  profitMargin: string;
  profitForecast: string;
  avgMarkupDesc: string;

  // Product Table
  tableTitle: string;
  tableSubtitle: string;
  itemsCount: string;
  addProductTable: string;
  scanReceiptTable: string;
  searchPlaceholder: string;
  clear: string;
  categoryLabel: string;
  allCategories: string;
  selectedItemsCount: string;
  batchMarkupLabel: string;
  apply: string;
  cancel: string;
  selectAll: string;
  colNo: string;
  colName: string;
  colCategory: string;
  colQuantity: string;
  colUnit: string;
  colUnitCost: string;
  colTotalCost: string;
  colMarkup: string;
  colUnitPrice: string;
  colSellingPrice: string;
  colExpectedRevenue: string;
  colExpectedProfit: string;
  colDateSupplier: string;
  colActions: string;
  noProductsFound: string;
  noProductsDesc: string;
  defaultSupplier: string;
  edit: string;
  delete: string;
  totalRow: string;
  totalIndicators: string;
  totalCostLabel: string;
  avgLabel: string;
  revenueLabel: string;
  guaranteedProfit: string;

  // Add / Edit Product Modal
  modalNewProductTitle: string;
  modalEditProductTitle: string;
  addProductModalTitle: string;
  editProductModalTitle: string;
  addProductModalSubtitle: string;
  modalProductDesc: string;
  productNameLabel: string;
  productNamePlaceholder: string;
  nameInputPlaceholder: string;
  categoryLabelModal: string;
  quantityLabel: string;
  unitLabel: string;
  unitCostLabel: string;
  markupPercentLabel: string;
  liveCalcTitle: string;
  liveUnitSelling: string;
  liveTotalCost: string;
  liveExpRevenue: string;
  liveExpProfit: string;
  supplierLabel: string;
  supplierPlaceholder: string;
  supplierInputLabel: string;
  supplierInputPlaceholder: string;
  dateLabel: string;
  notesLabel: string;
  notesPlaceholder: string;
  notesInputLabel: string;
  notesInputPlaceholder: string;
  saveChanges: string;
  addToTable: string;

  // AI Receipt Scanner Modal
  scannerModalTitle: string;
  scannerModalSubtitle: string;
  uploadImageText: string;
  dragDropText: string;
  takePhoto: string;
  selectFile: string;
  analyzingReceipt: string;
  pleaseWait: string;
  extractedItems: string;
  addAllToStore: string;
  scanAnother: string;
  uploadInvoicePrompt: string;
  uploadInvoiceDesc: string;
  demoInvoicePrompt: string;
  demoInvoiceNakladnoy: string;
  demoInvoiceChek: string;
  analyzingInvoice: string;
  analyzingInvoiceDesc: string;
  supplierFound: string;
  invoiceDate: string;
  detectedItems: string;
  askMarkupHeading: string;
  askMarkupSubheading: string;
  uploadAnotherImage: string;
  addToInventoryBtn: string;

  // Financial Stats & PDF Modal
  statsModalTitle: string;
  statsModalSubtitle: string;
  downloadPdfBtn: string;
  downloadPdfFullBtn: string;
  generatingPdf: string;
  categoryDistribution: string;
  catDistributionTitle: string;
  catLabel: string;
  topInvestedProducts: string;
  top5Title: string;
  byInvestment: string;
  officialPdfTitle: string;
  officialPdfDesc: string;
  kpiExpectedProfit: string;

  // Excel Manager Modal
  excelModalTitle: string;
  excelModalSubtitle: string;
  exportExcelBtn: string;
  exportExcelTitle: string;
  importExcelBtn: string;
  importExcelTitle: string;
  importExcelDesc: string;
  excelTemplateHint: string;
  readingExcel: string;
  close: string;

  // Quick Search Drawer
  quickSearchTitle: string;
  quickSearchSubtitle: string;
  searchProductInput: string;
  stockRemaining: string;
  calculatedSellingPrice: string;
  quickSamples: string;
  tryAnotherSearch: string;
  quickCalcLabel: string;
  calcQuantity: string;
  buyerPays: string;

  // Telegram Simulator & Webhook
  telegramTitle: string;
  tabChat: string;
  tabSetup: string;
  botCommandsTitle: string;
  writeMessagePlaceholder: string;
  send: string;
  enterTokenTitle: string;
  webhookSuccess: string;
  realBotTitle: string;
  realBotDesc: string;
  botTokenLabel: string;
  webhookUrlLabel: string;

  // Language Switcher labels
  langUzLatn: string;
  langUzCyrl: string;
  langUzLatnShort: string;
  langUzCyrlShort: string;

  // Hero & Footer & App
  heroRealtimeCalculation: string;
  heroHeading: string;
  heroSubtitle: string;
  heroScanInvoice: string;
  heroResetTooltip: string;
  webAppBackToWeb: string;
  webAppAuthorized: string;
  webAppScanBigBtn: string;
  footerSystem: string;
  footerDesc: string;
  footerTelegramView: string;
  footerCurrency: string;
  confirmDeleteProduct: string;
  confirmResetDemo: string;
}

export const translations: Record<Language, Translations> = {
  'uz-latn': {
    // Brand & Header
    brandTitle: 'SmartSavdo',
    brandSubtitle: "Do'kon tovarlari, fakturalar va xarajatlar boshqaruvi",
    aiVision: 'AI Vision',
    webAppTitle: 'SmartSavdo WebApp',
    webAppSubtitle: "Telegram do'kon boshqaruvi",
    authorized: 'Avtorizatsiyalangan',
    securityCheck: 'SmartSavdo xavfsizlik tekshiruvi...',
    loadingAuth: "Avtorizatsiya ma'lumotlari yuklanmoqda",
    logout: 'Chiqish',
    logoutTooltip: 'Tizimdan chiqish (Xavfsiz yopish)',
    logoutSuccess: 'Tizimdan muvaffaqiyatli chiqildi',
    welcome: 'Xush kelibsiz',
    currency: "so'm",

    // Header Nav & Actions
    searchBtn: 'Qidiruv',
    aiScannerBtn: 'AI Chek Skaneri',
    scannerShort: 'Skaner',
    newProductBtn: 'Yangi tovar',
    excelBtn: 'Excel',
    statsPdfBtn: 'Statistika / PDF',
    telegramBotBtn: 'Telegram Bot',
    webAppViewTooltip: "Telegram WebApp Ko'rinishi (Mobil simulyatsiya)",
    backToNormalView: "Asosiy Katta Ko'rinishga Qaytish",
    menuTitle: 'Menyu',
    quickActionsMenu: 'Tezkor Amallar',
    closeMenu: 'Yopish',

    // Product Details Modal
    productDetailsTitle: 'Tovar Tafsilotlari',
    productDetailsSubtitle: 'Mahsulot narxi, qoldigʻi va moliyaviy hisob-kitobi',
    unitProfit: '1 birlikdan sof foyda',
    stockStatus: 'Ombor holati',
    stockSufficient: 'Yetarli zaxira',
    stockLow: 'Kam qolgan',
    stockOut: 'Tugagan',
    quickSalesCalc: 'Tezkor Savdo Kalkulyatori',
    calcIfSold: 'Agar sotilsa:',
    calcTotalPay: "Mijoz to'laydigan jami:",
    calcNetProfit: "Do'konga tushadigan sof foyda:",
    copyInfoBtn: "Ma'lumotni nusxalash",
    copiedSuccess: 'Nusxalandi!',
    priceTagPreview: 'Narx yorligʻi (Vitrina)',
    skuCode: 'Tovar ID',
    clickRowNotice: "Batafsil ma'lumot va hisob-kitob uchun tovar ustiga bosing",
    estimatedRevenue: 'Kutilayotgan tushum',
    deleteConfirmTitle: "Tovarni o'chirishni tasdiqlaysizmi?",
    deleteConfirmDesc: "Bu tovar do'kon zaxirasidan butunlay o'chiriladi. Ushbu amalni bekor qilib bo'lmaydi.",
    deleteProductConfirmBtn: "Ha, o'chirilsin",

    // Login Screen
    loginTitle: 'SmartSavdo Tizimiga Kirish',
    loginSubtitle: "Do'kon tovarlari, savdo kassa va ombor hisoboti",
    loginRequiredNotice: 'Boshqaruv paneliga kirish uchun login va parolingizni kiriting',
    usernameLabel: 'Login yoki Foydalanuvchi nomi',
    usernamePlaceholder: 'Masalan: admin yoki kassir',
    passwordLabel: 'Maxfiy Parol',
    passwordPlaceholder: 'Parolingizni kiriting',
    submitLogin: 'Tizimga Kirish',
    submittingLogin: 'Tekshirilmoqda...',
    quickAccounts: 'Tezkor Kirish (Namunaviy hisoblar)',
    adminRole: "Do'kon Egasi (Admin)",
    managerRole: 'Bosh Hisobchi (Menejer)',
    cashierRole: 'Kassir / Sotuvchi',
    secureAccessNote: "Xavfsiz do'kon tizimi. Barcha ma'lumotlar shifrlangan.",
    loginErrorMissing: 'Iltimos, login va parolni kiriting',

    // KPI Cards
    kpiTotalCost: 'Jami Xarajat (Tannarx)',
    kpiTotalRevenue: 'Kutilayotgan Savdo (Tushum)',
    kpiTotalProfit: 'Kutilayotgan Sof Foyda',
    kpiAvgMarkup: "O'rtacha Ustama Foizi",
    itemsInStock: 'xil tovar zaxirada',
    fullTurnoverDesc: "To'liq sotilgandagi umumiy aylanma",
    profitMargin: 'marja',
    profitForecast: 'Sof foyda прогнози',
    avgMarkupDesc: "Tannarx ustiga qo'yilgan o'rtacha ustama",

    // Product Table
    tableTitle: 'Tovarlar Jadvali va Foyda Hisoblagich',
    tableSubtitle: "Kelgan tovarlar, tannarxlar, ustama foizlari va kutilayotgan sof foyda hisob-kitobi",
    itemsCount: 'ta',
    addProductTable: "Tovar qo'shish",
    scanReceiptTable: 'Hisob-faktura skanerlash',
    searchPlaceholder: "Tovar nomi, ta'minotchi qidirish...",
    clear: 'Tozalash',
    categoryLabel: 'Kategoriya:',
    allCategories: 'Barchasi',
    selectedItemsCount: 'ta tovar tanlandi',
    batchMarkupLabel: "Ommaviy ustama belgilang:",
    apply: "Qo'llash",
    cancel: 'Bekor qilish',
    selectAll: 'Barchasini tanlash',
    colNo: '№',
    colName: 'Tovar Nomi',
    colCategory: 'Kategoriya',
    colQuantity: 'Miqdor',
    colUnit: 'Birlik',
    colUnitCost: '1 Birlik Tannarx',
    colTotalCost: 'Jami Tannarx',
    colMarkup: 'Ustama',
    colUnitPrice: 'Sotish Narxi',
    colSellingPrice: 'Sotish Narxi',
    colExpectedRevenue: 'Kutilayotgan Tushum',
    colExpectedProfit: 'Kutilgan Foyda',
    colDateSupplier: "Sana & Ta'minotchi",
    colActions: 'Amallar',
    noProductsFound: 'Hech qanday tovar topilmadi',
    noProductsDesc: "Qidiruv so'zini o'zgartiring yoki yangi tovar/faktura qo'shing.",
    defaultSupplier: "Do'kon ombori",
    edit: 'Tahrirlash',
    delete: "O'chirish",
    totalRow: 'JAMI',
    totalIndicators: "JAMI HISOBLANGAN KO'RSATKICHLAR",
    totalCostLabel: 'Xarajat:',
    avgLabel: "O'rtacha:",
    revenueLabel: 'Tushum:',
    guaranteedProfit: 'Sof foyda kafolatlangan',

    // Add / Edit Product Modal
    modalNewProductTitle: 'Yangi Tovar Kiritish',
    modalEditProductTitle: 'Tovarni Tahrirlash',
    addProductModalTitle: "Yangi Tovar Qo'shish",
    editProductModalTitle: 'Tovarni Tahrirlash',
    addProductModalSubtitle: "Tovarning kelgan narxi, miqdori va sotish ustama foizini kiriting",
    modalProductDesc: "Tovarning kelgan narxi, miqdori va sotish ustama foizini kiriting",
    productNameLabel: 'Tovar Nomi',
    productNamePlaceholder: 'Masalan: Shakar 50kg yoki Coca-Cola 1.5L',
    nameInputPlaceholder: 'Masalan: Shakar 50kg yoki Coca-Cola 1.5L',
    categoryLabelModal: 'Kategoriya',
    quantityLabel: 'Kelgan Miqdori',
    unitLabel: "O'lchov Birligi",
    unitCostLabel: "1 Birlik Tannarxi (so'mda)",
    markupPercentLabel: 'Ustama Foizi (%)',
    liveCalcTitle: 'Avtomatik Hisob-Kitob (Jonli):',
    liveUnitSelling: 'Sotish Narxi',
    liveTotalCost: 'Jami Tannarx',
    liveExpRevenue: 'Kutilayotgan Tushum',
    liveExpProfit: 'Kutilayotgan Sof Foyda',
    supplierLabel: "Ta'minotchi (yetkazib beruvchi)",
    supplierPlaceholder: 'Masalan: Agro Baraka MCHJ',
    supplierInputLabel: "Ta'minotchi (yetkazib beruvchi)",
    supplierInputPlaceholder: 'Masalan: Agro Baraka MCHJ',
    dateLabel: 'Sana',
    notesLabel: "Qo'shimcha Izoh",
    notesPlaceholder: 'Masalan: 1-navli, ombor A-sektor',
    notesInputLabel: "Qo'shimcha Izoh",
    notesInputPlaceholder: 'Masalan: 1-navli, ombor A-sektor',
    saveChanges: "O'zgarishlarni Saqlash",
    addToTable: "Jadvalga Qo'shish",

    // AI Receipt Scanner Modal
    scannerModalTitle: 'AI Hisob-Faktura va Chek Skaneri',
    scannerModalSubtitle: "Gemini Vision orqali qog'oz fakturadan tovarlar, miqdor va narxlarni ajratib olish",
    uploadImageText: 'Faktura yoki chek rasmini yuklang',
    dragDropText: 'Rasmni bu yerga tashlang yoki tanlang',
    takePhoto: 'Kameradan rasmga olish',
    selectFile: 'Fayldan tanlash',
    analyzingReceipt: 'AI Fakturani Tahlil Qilmoqda...',
    pleaseWait: 'Bir necha soniya kuting',
    extractedItems: 'Ajratib olingan tovarlar:',
    addAllToStore: "Barchasini Do'konga Qo'shish",
    scanAnother: 'Boshqa chek yuklash',
    uploadInvoicePrompt: 'Faktura yoki chek rasmini yuklang',
    uploadInvoiceDesc: 'Rasmni bu yerga tashlang yoki faylni tanlash uchun bosing (JPG, PNG)',
    demoInvoicePrompt: "Rasm yo'qmi? Namunaviy faktura bilan sinab ko'ring:",
    demoInvoiceNakladnoy: 'Namunaviy Hisob-faktura (Nakladnoy)',
    demoInvoiceChek: 'Namunaviy Kassa Cheki',
    analyzingInvoice: 'Gemini Vision rasm tahlil qilmoqda...',
    analyzingInvoiceDesc: "Hisob-faktura qatorlari, tovar nomlari, o'lchov birliklari va kelish narxlari aniqlanmoqda.",
    supplierFound: "Ta'minotchi:",
    invoiceDate: 'Faktura sanasi:',
    detectedItems: 'Topilgan tovarlar:',
    askMarkupHeading: "Ushbu tovarlar ustiga necha foiz ustama qo'ymoqchisiz?",
    askMarkupSubheading: "Har bir tovarning tavsiya etilgan sotish narxi va kutilayotgan sof foydasi avtomatik hisoblanadi.",
    uploadAnotherImage: 'Boshqa rasm yuklash',
    addToInventoryBtn: "Umumiy jadvalga va Excelga qo'shish",

    // Financial Stats & PDF Modal
    statsModalTitle: 'Moliyaviy Tahlil va A4 Hisobot',
    statsModalSubtitle: "Tovar toifalari bo'yicha daromad tahlili va rasmiy A4 PDF hisoboti",
    downloadPdfBtn: 'A4 PDF Hisobotni Yuklab Olish',
    downloadPdfFullBtn: 'A4 PDF Hisobotni Yuklab Olish',
    generatingPdf: 'PDF tayyorlanmoqda...',
    categoryDistribution: "Kategoriyalar Bo'yicha Xarajat va Daromad Taqsimoti",
    catDistributionTitle: "Kategoriyalar Bo'yicha Xarajat va Daromad Taqsimoti",
    catLabel: 'Kategoriya',
    topInvestedProducts: "Eng Ko'p Mablag' Sarflangan Tovarlar (Top 5)",
    top5Title: "Eng Ko'p Mablag' Sarflangan Tovarlar (Top 5)",
    byInvestment: "Xarajat hajmiga ko'ra",
    officialPdfTitle: 'Rasmiy A4 PDF Hisobot',
    officialPdfDesc: "Soliq, kassa yoki ichki audit uchun barcha tovarlar va moliyaviy hisobotni qog'oz formatida yuklab oling",
    kpiExpectedProfit: 'Kutilayotgan Sof Foyda',

    // Excel Manager Modal
    excelModalTitle: 'Excel (.xlsx) Bilan Ishlash',
    excelModalSubtitle: "Tovar bazasini Excel faylga yuklab olish yoki tayyor Excel jadvalidan import qilish",
    exportExcelBtn: 'Barcha Tovarlarni Excelga Yuklab Olish (.xlsx)',
    exportExcelTitle: 'Excelga Eksport Qilish',
    importExcelBtn: 'Excel Faylni Yuklash (Import)',
    importExcelTitle: 'Exceldan Import Qilish',
    importExcelDesc: "Excel faylini bu yerga yuklang yoki tanlang (.xlsx, .xls)",
    excelTemplateHint: 'Ustunlar: Nomi, Kategoriya, Miqdori, Birligi, Tannarxi, Ustama foizi',
    readingExcel: "Excel fayl o'qilmoqda...",
    close: 'Yopish',

    // Quick Search Drawer
    quickSearchTitle: 'Tezkor Tovar Qidiruvi',
    quickSearchSubtitle: "Tovar nomi bo'yicha qoldiq, tannarx va tavsiya etilgan sotish narxi",
    searchProductInput: 'Tovar nomini yozing...',
    stockRemaining: 'Qoldiq:',
    calculatedSellingPrice: 'Tavsiya narxi:',
    quickSamples: 'Tezkor namunalar:',
    tryAnotherSearch: "Boshqa tovar nomini qidirib ko'ring.",
    quickCalcLabel: 'Tezkor hisob-kitob (Kassa):',
    calcQuantity: "Xaridor olmoqchi bo'lgan miqdor:",
    buyerPays: "Xaridor to'laydigan jami summa:",

    // Telegram Simulator & Webhook
    telegramTitle: 'Telegram Bot Boshqaruvi va Simulyator',
    tabChat: 'Bot Chat Simulyatori',
    tabSetup: 'API Token va Webhook',
    botCommandsTitle: 'Bot Buyruqlari:',
    writeMessagePlaceholder: 'Xabar yoki buyruq yozing...',
    send: 'Yuborish',
    enterTokenTitle: 'Telegram Bot Tokenini Ulang',
    webhookSuccess: "Webhook muvaffaqiyatli o'rnatildi!",
    realBotTitle: 'Haqiqiy Telegram Botga Ulanish',
    realBotDesc: "BotFather'dan olingan tokenni kiriting va bosing. Bot avtomatik buyruqlarni qabul qiladi.",
    botTokenLabel: 'Telegram Bot Tokeni',
    webhookUrlLabel: 'Webhook URL manzili',

    // Language Switcher labels
    langUzLatn: "O'zbekcha",
    langUzCyrl: 'Ўзбекча',
    langUzLatnShort: 'Lotin',
    langUzCyrlShort: 'Кирилл',

    // Hero & Footer & App
    heroRealtimeCalculation: "O'zbekiston so'mida real vaqtda hisob-kitob",
    heroHeading: 'Tovar Tannarxlari, Kelgan Nakladnoylar va Sof Foyda Boshqaruvi',
    heroSubtitle: "Do'konga kelgan chek yoki qog'oz faktura rasmini yuklang, AI avtomatik tovarlar va tannarxlarni ajratadi, ustama foizini belgilang va bir zumda sotish narxi hamda sof foydani Excelga oling.",
    heroScanInvoice: 'Faktura Skanerlash',
    heroResetTooltip: 'Namunaviy tovarlarni qayta yuklash',
    webAppBackToWeb: '← Web rejimiga qaytish',
    webAppAuthorized: 'Avtorizatsiyalangan',
    webAppScanBigBtn: 'CHEK YOKI FAKTURANI AI BILAN SKANERLASH',
    footerSystem: 'SmartSavdo Tizimi',
    footerDesc: 'Tovarlar, xarajatlar va kassa tushumi hisoblagichi',
    footerTelegramView: "Telegram WebApp ko'rinishi",
    footerCurrency: "O'zbekiston So'mi (UZS)",
    confirmDeleteProduct: "Haqiqatan ham ushbu tovarni ro'yxatdan o'chirmoqchimisiz?",
    confirmResetDemo: "Barcha ma'lumotlarni namunaviy tovarlar ro'yxatiga qaytarmoqchimisiz?",
  },
  'uz-cyrl': {
    // Brand & Header
    brandTitle: 'SmartSavdo',
    brandSubtitle: 'Дўкон товарлари, ҳисоб-фактуралар ва харажатлар бошқаруви',
    aiVision: 'AI Vision',
    webAppTitle: 'SmartSavdo WebApp',
    webAppSubtitle: 'Telegram дўкон бошқаруви',
    authorized: 'Авторизацияланган',
    securityCheck: 'SmartSavdo хавфсизлик текшируви...',
    loadingAuth: 'Авторизация маълумотлари юкланмоқда',
    logout: 'Чиқиш',
    logoutTooltip: 'Тизимдан чиқиш (Хавфсиз ёпиш)',
    logoutSuccess: 'Тизимдан муваффақиятли чиқилди',
    welcome: 'Хуш келибсиз',
    currency: 'сўм',

    // Header Nav & Actions
    searchBtn: 'Қидирув',
    aiScannerBtn: 'AI Чек Сканери',
    scannerShort: 'Сканер',
    newProductBtn: 'Янги товар',
    excelBtn: 'Excel',
    statsPdfBtn: 'Статистика / PDF',
    telegramBotBtn: 'Telegram Бот',
    webAppViewTooltip: 'Telegram WebApp Кўриниши (Мобил симуляция)',
    backToNormalView: 'Асосий Катта Кўринишга Қайтиш',
    menuTitle: 'Меню',
    quickActionsMenu: 'Тезкор Амаллар',
    closeMenu: 'Ёпиш',

    // Product Details Modal
    productDetailsTitle: 'Товар Тафсилотлари',
    productDetailsSubtitle: 'Маҳсулот нархи, қолдиғи ва молиявий ҳисоб-китоби',
    unitProfit: '1 бирликдан соф фойда',
    stockStatus: 'Омбор ҳолати',
    stockSufficient: 'Етарли захира',
    stockLow: 'Кам қолган',
    stockOut: 'Тугаган',
    quickSalesCalc: 'Тезкор Савдо Калькулятори',
    calcIfSold: 'Агар сотилса:',
    calcTotalPay: 'Мижоз тўлайдиган жами:',
    calcNetProfit: 'Дўконга тушадиган соф фойда:',
    copyInfoBtn: 'Маълумотни нусхалаш',
    copiedSuccess: 'Нусхаланди!',
    priceTagPreview: 'Нарх ёрлиғи (Витрина)',
    skuCode: 'Товар ID',
    clickRowNotice: 'Батафсил маълумот ва ҳисоб-китоб учун товар устига босинг',
    estimatedRevenue: 'Кутилаётган тушум',
    deleteConfirmTitle: 'Товарни ўчиришни тасдиқлайсизми?',
    deleteConfirmDesc: 'Бу товар дўкон захирасидан бутунлай ўчирилади. Ушбу амални бекор қилиб бўлмайди.',
    deleteProductConfirmBtn: 'Ҳа, ўчирилсин',

    // Login Screen
    loginTitle: 'SmartSavdo Тизимига Кириш',
    loginSubtitle: 'Дўкон товарлари, савдо касса ва омбор ҳисоботи',
    loginRequiredNotice: 'Бошқарув панелига кириш учун логин ва паролингизни киритинг',
    usernameLabel: 'Логин ёки Фойдаланувчи номи',
    usernamePlaceholder: 'Масалан: admin ёки kassir',
    passwordLabel: 'Махфий Парол',
    passwordPlaceholder: 'Паролингизни киритинг',
    submitLogin: 'Тизимга Кириш',
    submittingLogin: 'Текширилмоқда...',
    quickAccounts: 'Тезкор Кириш (Намунавий ҳисоблар)',
    adminRole: 'Дўкон Эгаси (Админ)',
    managerRole: 'Бош Ҳисобчи (Менежер)',
    cashierRole: 'Кассир / Сотувчи',
    secureAccessNote: 'Хавфсиз дўкон тизими. Барча маълумотлар шифрланган.',
    loginErrorMissing: 'Илтимос, логин ва паролни киритинг',

    // KPI Cards
    kpiTotalCost: 'Жами Харажат (Таннарх)',
    kpiTotalRevenue: 'Кутилаётган Савдо (Тушум)',
    kpiTotalProfit: 'Кутилаётган Соф Фойда',
    kpiAvgMarkup: 'Ўртача Устама Фоизи',
    itemsInStock: 'хил товар захирада',
    fullTurnoverDesc: 'Тўлиқ сотилгандаги умумий айланма',
    profitMargin: 'маржа',
    profitForecast: 'Соф фойда прогнози',
    avgMarkupDesc: 'Таннарх устига қўйилган ўртача устама',

    // Product Table
    tableTitle: 'Товарлар Жадвали ва Фойда Ҳисоблагич',
    tableSubtitle: 'Келган товарлар, таннархлар, устама фоизлари ва кутилаётган соф фойда ҳисоб-китоби',
    itemsCount: 'та',
    addProductTable: 'Товар қўшиш',
    scanReceiptTable: 'Ҳисоб-фактура сканерлаш',
    searchPlaceholder: 'Товар номи, таъминотчи қидириш...',
    clear: 'Тозалаш',
    categoryLabel: 'Категория:',
    allCategories: 'Барчаси',
    selectedItemsCount: 'та товар танланди',
    batchMarkupLabel: 'Оммавий устама белгиланг:',
    apply: 'Қўллаш',
    cancel: 'Бекор қилиш',
    selectAll: 'Барчасини танлаш',
    colNo: '№',
    colName: 'Товар Номи',
    colCategory: 'Категория',
    colQuantity: 'Миқдор',
    colUnit: 'Бирлик',
    colUnitCost: '1 Бирлик Таннарх',
    colTotalCost: 'Жами Таннарх',
    colMarkup: 'Устама',
    colUnitPrice: 'Сотиш Нархи',
    colSellingPrice: 'Сотиш Нархи',
    colExpectedRevenue: 'Кутилаётган Тушум',
    colExpectedProfit: 'Кутилган Фойда',
    colDateSupplier: 'Сана & Таъминотчи',
    colActions: 'Амаллар',
    noProductsFound: 'Ҳеч қандай товар топилмади',
    noProductsDesc: 'Қидирув сўзини ўзгартиринг ёки янги товар/фактура қўшинг.',
    defaultSupplier: 'Дўкон омбори',
    edit: 'Таҳрирлаш',
    delete: 'Ўчириш',
    totalRow: 'ЖАМИ',
    totalIndicators: 'ЖАМИ ҲИСОБЛАНГАН КЎРСАТКИЧЛАР',
    totalCostLabel: 'Харажат:',
    avgLabel: 'Ўртача:',
    revenueLabel: 'Тушум:',
    guaranteedProfit: 'Соф фойда кафолатланган',

    // Add / Edit Product Modal
    modalNewProductTitle: 'Янги Товар Кириcolumnтиш',
    modalEditProductTitle: 'Товарни Таҳрирлаш',
    addProductModalTitle: 'Янги Товар Қўшиш',
    editProductModalTitle: 'Товарни Таҳрирлаш',
    addProductModalSubtitle: 'Товарнинг келган нархи, миқдори ва сотиш устама фоизини киритинг',
    modalProductDesc: 'Товарнинг келган нархи, миқдори ва сотиш устама фоизини киритинг',
    productNameLabel: 'Товар Номи',
    productNamePlaceholder: 'Масалан: Шакар 50кг ёки Coca-Cola 1.5L',
    nameInputPlaceholder: 'Масалан: Шакар 50кг ёки Coca-Cola 1.5L',
    categoryLabelModal: 'Категория',
    quantityLabel: 'Келган Миқдори',
    unitLabel: 'Ўлчов Бирлиги',
    unitCostLabel: '1 Бирлик Таннархи (сўмда)',
    markupPercentLabel: 'Устама Фоизи (%)',
    liveCalcTitle: 'Автоматик Ҳисоб-Китоб (Жонли):',
    liveUnitSelling: 'Сотиш Нархи',
    liveTotalCost: 'Жами Таннарх',
    liveExpRevenue: 'Кутилаётган Тушум',
    liveExpProfit: 'Кутилаётган Соф Фойда',
    supplierLabel: 'Таъминотчи (етказиб берувчи)',
    supplierPlaceholder: 'Масалан: Агро Барака МЧЖ',
    supplierInputLabel: 'Таъминотчи (етказиб берувчи)',
    supplierInputPlaceholder: 'Масалан: Агро Барака МЧЖ',
    dateLabel: 'Сана',
    notesLabel: 'Қўшимча Изоҳ',
    notesPlaceholder: 'Масалан: 1-навли, омбор А-сектор',
    notesInputLabel: 'Қўшимча Изоҳ',
    notesInputPlaceholder: 'Масалан: 1-навли, омбор А-сектор',
    saveChanges: 'Ўзгаришларни Сақлаш',
    addToTable: 'Жадвалга Қўшиш',

    // AI Receipt Scanner Modal
    scannerModalTitle: 'AI Ҳисоб-Фактура ва Чек Сканери',
    scannerModalSubtitle: 'Gemini Vision орқали қоғоз фактурадан товарлар, миқдор ва нархларни ажратиб олиш',
    uploadImageText: 'Фактура ёки чек расмини юкланг',
    dragDropText: 'Расмни бу ерга ташланг ёки танланг',
    takePhoto: 'Камерадан расмга олиш',
    selectFile: 'Файлдан танлаш',
    analyzingReceipt: 'AI Фактурани Таҳлил Қилмоқда...',
    pleaseWait: 'Бир неча сония кутинг',
    extractedItems: 'Ажратиб олинган товарлар:',
    addAllToStore: 'Барчасини Дўконга Қўшиш',
    scanAnother: 'Бошқа чек юклаш',
    uploadInvoicePrompt: 'Фактура ёки чек расмини юкланг',
    uploadInvoiceDesc: 'Расмни бу ерга ташланг ёки файлни танлаш учун босинг (JPG, PNG)',
    demoInvoicePrompt: 'Расм йўқми? Намунавий фактура билан синаб кўринг:',
    demoInvoiceNakladnoy: 'Намунавий Ҳисоб-фактура (Накладной)',
    demoInvoiceChek: 'Намунавий Касса Чеки',
    analyzingInvoice: 'Gemini Vision расм таҳлил қилмоқда...',
    analyzingInvoiceDesc: 'Ҳисоб-фактура қаторлари, товар номлари, ўлчов бирликлари ва келиш нархлари аниқланмоқда.',
    supplierFound: 'Таъминотчи:',
    invoiceDate: 'Фактура санаси:',
    detectedItems: 'Топилган товарлар:',
    askMarkupHeading: 'Ушбу товарлар устига неча фоиз устама қўймоқчисиз?',
    askMarkupSubheading: 'Ҳар бир товарнинг тавсия этилган сотиш нархи ва кутилаётган соф фойдаси автоматик ҳисобланади.',
    uploadAnotherImage: 'Бошқа расм юклаш',
    addToInventoryBtn: 'Умумий жадвалга ва Excelга қўшиш',

    // Financial Stats & PDF Modal
    statsModalTitle: 'Молиявий Таҳлил ва А4 Ҳисобот',
    statsModalSubtitle: 'Товар тоифалари бўйича даромад таҳлили ва расмий А4 PDF ҳисоботи',
    downloadPdfBtn: 'А4 PDF Ҳисоботни Юклаб Олиш',
    downloadPdfFullBtn: 'А4 PDF Ҳисоботни Юклаб Олиш',
    generatingPdf: 'PDF тайёрланмоқда...',
    categoryDistribution: 'Категориялар Бўйича Харажат ва Даромад Тақсимоти',
    catDistributionTitle: 'Категориялар Бўйича Харажат ва Даромад Тақсимоти',
    catLabel: 'Категория',
    topInvestedProducts: 'Энг Кўп Маблағ Сарфланган Товарлар (Топ 5)',
    top5Title: 'Энг Кўп Маблағ Сарфланган Товарлар (Топ 5)',
    byInvestment: 'Харажат ҳажмига кўра',
    officialPdfTitle: 'Расмий А4 PDF Ҳисобот',
    officialPdfDesc: 'Солиқ, касса ёки ички аудит учун барча товарлар ва молиявий ҳисоботни қоғоз форматида юклаб олинг',
    kpiExpectedProfit: 'Кутилаётган Соф Фойда',

    // Excel Manager Modal
    excelModalTitle: 'Excel (.xlsx) Билан Ишлаш',
    excelModalSubtitle: 'Товар базасини Excel файлга юклаб олиш ёки тайёр Excel жадвалидан импорт қилиш',
    exportExcelBtn: 'Барча Товарларни Excelга Юклаб Олиш (.xlsx)',
    exportExcelTitle: 'Excelга Экспорт Қилиш',
    importExcelBtn: 'Excel Файлни Юклаш (Импорт)',
    importExcelTitle: 'Excelдан Импорт Қилиш',
    importExcelDesc: 'Excel файлини бу ерга юкланг ёки танланг (.xlsx, .xls)',
    excelTemplateHint: 'Устунлар: Номи, Категория, Миқдори, Бирлиги, Таннархи, Устама фоизи',
    readingExcel: 'Excel файл ўқилмоқда...',
    close: 'Ёпиш',

    // Quick Search Drawer
    quickSearchTitle: 'Тезкор Товар Қидируви',
    quickSearchSubtitle: 'Товар номи бўйича қолдиқ, таннарх ва тавсия этилган сотиш нархи',
    searchProductInput: 'Товар номини ёзинг...',
    stockRemaining: 'Қолдиқ:',
    calculatedSellingPrice: 'Тавсия нархи:',
    quickSamples: 'Тезкор намуналар:',
    tryAnotherSearch: 'Бошқа товар номини қидириб кўринг.',
    quickCalcLabel: 'Тезкор ҳисоб-китоб (Касса):',
    calcQuantity: 'Харидор олмоқчи бўлган миқдор:',
    buyerPays: 'Харидор тўлайдиган жами сумма:',

    // Telegram Simulator & Webhook
    telegramTitle: 'Telegram Бот Бошқаруви ва Симулятори',
    tabChat: 'Бот Чат Симулятори',
    tabSetup: 'API Токен ва Webhook',
    botCommandsTitle: 'Бот Буйруқлари:',
    writeMessagePlaceholder: 'Хабар ёки буйруқ ёзинг...',
    send: 'Юбориш',
    enterTokenTitle: 'Telegram Бот Токенини Уланг',
    webhookSuccess: 'Webhook муваффақиятли ўрнатилди!',
    realBotTitle: 'Ҳақиқий Telegram Ботга Уланиш',
    realBotDesc: 'BotFather\'дан олинган токенни киритинг ва босинг. Бот автоматик буйруқларни қабул қилади.',
    botTokenLabel: 'Telegram Бот Токени',
    webhookUrlLabel: 'Webhook URL манзили',

    // Language Switcher labels
    langUzLatn: "O'zbekcha",
    langUzCyrl: 'Ўзбекча',
    langUzLatnShort: 'Lotin',
    langUzCyrlShort: 'Кирилл',

    // Hero & Footer & App
    heroRealtimeCalculation: 'Ўзбекистон сўмида реал вақтда ҳисоб-китоб',
    heroHeading: 'Товар Таннархлари, Келган Накладнойлар ва Соф Фойда Бошқаруви',
    heroSubtitle: 'Дўконга келган чек ёки қоғоз фактура расмини юкланг, AI автоматик товарлар ва таннархларни ажратади, устама фоизини белгиланг ва бир зумда сотиш нархи ҳамда соф фойдани Excelга олинг.',
    heroScanInvoice: 'Ҳисоб-фактура Сканерлаш',
    heroResetTooltip: 'Намунавий товарларни қайта юклаш',
    webAppBackToWeb: '← Веб режимига қайтиш',
    webAppAuthorized: 'Авторизацияланган',
    webAppScanBigBtn: 'ЧЕК ЁКИ ФАКТУРАНИ AI БИЛАН СКАНЕРЛАШ',
    footerSystem: 'SmartSavdo Тизими',
    footerDesc: 'Товарлар, харажатлар ва касса тушуми ҳисоблагичи',
    footerTelegramView: 'Telegram WebApp кўриниши',
    footerCurrency: 'Ўзбекистон Сўми (UZS)',
    confirmDeleteProduct: 'Ҳақиқатан ҳам ушбу товарни рўйхатдан ўчирмоқчимисиз?',
    confirmResetDemo: 'Барча маълумотларни намунавий товарлар рўйхатига қайтармоқчимисиз?',
  },
};

// Category and Unit Mappings for Latin <-> Cyrillic
export const categoryMapToCyrillic: Record<string, string> = {
  'Oziq-ovqat': 'Озиқ-овқат',
  'Ichimliklar': 'Ичимликлар',
  'Meva-Sabzavot': 'Мева-Сабзавот',
  'Xo\'jalik mollari': 'Хўжалик моллари',
  'Sut mahsulotlari': 'Сут маҳсулотлари',
  'Umumiy': 'Умумий',
};

export const unitMapToCyrillic: Record<string, string> = {
  'dona': 'дона',
  'kg': 'кг',
  'litr': 'литр',
  'qop': 'қоп',
  'quti': 'қути',
  'blok': 'блок',
  'metr': 'метр',
};

export const categoryMapToLatin: Record<string, string> = {
  'Озиқ-овқат': 'Oziq-ovqat',
  'Ичимликлар': 'Ichimliklar',
  'Мева-Сабзавот': 'Meva-Sabzavot',
  'Хўжалик моллари': "Xo'jalik mollari",
  'Сут маҳсулотлари': 'Sut mahsulotlari',
  'Умумий': 'Umumiy',
};

export const unitMapToLatin: Record<string, string> = {
  'дона': 'dona',
  'кг': 'kg',
  'литр': 'litr',
  'қоп': 'qop',
  'қути': 'quti',
  'блок': 'blok',
  'метр': 'metr',
};

export function translateCategory(cat: string, lang: Language): string {
  if (lang === 'uz-cyrl') {
    return categoryMapToCyrillic[cat] || cat;
  }
  return categoryMapToLatin[cat] || cat;
}

export function translateUnit(unit: string, lang: Language): string {
  if (lang === 'uz-cyrl') {
    return unitMapToCyrillic[unit] || unit;
  }
  return unitMapToLatin[unit] || unit;
}
