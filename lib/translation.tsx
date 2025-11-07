"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

// Define supported languages
export const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "it", name: "Italiano" },
  { code: "pt", name: "Português" },
  { code: "zh", name: "中文" },
  { code: "ja", name: "日本語" },
  { code: "ar", name: "العربية" },
  { code: "ru", name: "Русский" },
  { code: "si", name: "සිංහල" },
  { code: "hi", name: "हिन्दी" },
]

// Translation cache to avoid unnecessary API calls
const translationCache: Record<string, Record<string, string>> = {}

// Simulated translation function
async function simulateTranslation(text: string, targetLang: string): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 100))

  const commonPhrases: Record<string, Record<string, string>> = {
    es: {
      Dashboard: "Panel de control",
      Reservation: "Reserva",
      Room: "Habitación",
      Rates: "Tarifas",
      Bookings: "Reservas",
      Settings: "Configuración",
      Users: "Usuarios",
      Currency: "Moneda",
      "Total Revenue": "Ingresos totales",
      "Room Occupancy": "Ocupación de habitaciones",
      Guests: "Huéspedes",
      "Front Desk": "Recepción",
      Arrivals: "Llegadas",
      Departures: "Salidas",
      Financials: "Finanzas",
      "Upgrade to Pro": "Actualizar a Pro",
      "Log Out": "Cerrar sesión",
      "from last month": "desde el mes pasado",
      "Room Types": "Tipos de habitación",
      Channels: "Canales",
      Purchases: "Compras",
      Expenses: "Gastos",
      Payables: "Cuentas por pagar",
      Receivables: "Cuentas por cobrar",
      "Profit and Loss": "Pérdidas y ganancias",
      Taxes: "Impuestos",
      "Travel Agents": "Agentes de viajes",
      Suppliers: "Proveedores",
      Account: "Cuenta",
      Billing: "Facturación",
      Notifications: "Notificaciones",
      "Profit & Loss": "Pérdidas y ganancias",
      "My Account": "Mi cuenta",
      "Room & Rates": "Habitación y tarifas",
      POS: "Punto de Venta",
      Chat: "Chat",
    },
    fr: {
      Dashboard: "Tableau de bord",
      Reservation: "Réservation",
      Room: "Chambre",
      Rates: "Tarifs",
      Bookings: "Réservations",
      Settings: "Paramètres",
      Users: "Utilisateurs",
      Currency: "Devise",
      "Total Revenue": "Revenu total",
      "Room Occupancy": "Occupation des chambres",
      Guests: "Invités",
      "Front Desk": "Réception",
      Arrivals: "Arrivées",
      Departures: "Départs",
      Financials: "Finances",
      "Upgrade to Pro": "Passer à Pro",
      "Log Out": "Déconnexion",
      "from last month": "par rapport au mois dernier",
      "Room Types": "Types de chambres",
      Channels: "Canaux",
      Purchases: "Achats",
      Expenses: "Dépenses",
      Payables: "Comptes à payer",
      Receivables: "Comptes à recevoir",
      "Profit and Loss": "Pertes et profits",
      Taxes: "Impôts",
      "Travel Agents": "Agents de voyage",
      Suppliers: "Fournisseurs",
      Account: "Compte",
      Billing: "Facturation",
      Notifications: "Notifications",
      "Profit & Loss": "Pertes et profits",
      "My Account": "Mon compte",
      "Room & Rates": "Chambre et tarifs",
      POS: "Point de vente",
      Chat: "Discussion",
    },
    de: {
      Dashboard: "Armaturenbrett",
      Reservation: "Reservierung",
      Room: "Zimmer",
      Rates: "Preise",
      Bookings: "Buchungen",
      Settings: "Einstellungen",
      Users: "Benutzer",
      Currency: "Währung",
      "Total Revenue": "Gesamtumsatz",
      "Room Occupancy": "Zimmerbelegung",
      Guests: "Gäste",
      "Front Desk": "Rezeption",
      Arrivals: "Ankünfte",
      Departures: "Abfahrten",
      Financials: "Finanzen",
      "Upgrade to Pro": "Upgrade auf Pro",
      "Log Out": "Abmelden",
      "from last month": "vom letzten Monat",
      "Room Types": "Zimmertypen",
      Channels: "Kanäle",
      Purchases: "Einkäufe",
      Expenses: "Ausgaben",
      Payables: "Verbindlichkeiten",
      Receivables: "Forderungen",
      "Profit and Loss": "Gewinn und Verlust",
      Taxes: "Steuern",
      "Travel Agents": "Reisebüros",
      Suppliers: "Lieferanten",
      Account: "Konto",
      Billing: "Abrechnung",
      Notifications: "Benachrichtigungen",
      "Profit & Loss": "Gewinn und Verlust",
      "My Account": "Mein Konto",
      "Room & Rates": "Zimmer und Preise",
      POS: "Kassensystem",
      Chat: "Chat",
    },
    it: {
      Dashboard: "Cruscotto",
      Reservation: "Prenotazione",
      Room: "Stanza",
      Rates: "Tariffe",
      Bookings: "Prenotazioni",
      Settings: "Impostazioni",
      Users: "Utenti",
      Currency: "Valuta",
      "Total Revenue": "Entrate totali",
      "Room Occupancy": "Occupazione delle stanze",
      Guests: "Ospiti",
      "Front Desk": "Reception",
      Arrivals: "Arrivi",
      Departures: "Partenze",
      Financials: "Finanze",
      "Upgrade to Pro": "Aggiorna a Pro",
      "Log Out": "Disconnettersi",
      "from last month": "dal mese scorso",
      "Room Types": "Tipi di camera",
      Channels: "Canali",
      Purchases: "Acquisti",
      Expenses: "Spese",
      Payables: "Debiti",
      Receivables: "Crediti",
      "Profit and Loss": "Profitti e perdite",
      Taxes: "Tasse",
      "Travel Agents": "Agenzie di viaggio",
      Suppliers: "Fornitori",
      Account: "Account",
      Billing: "Fatturazione",
      Notifications: "Notifiche",
      "Profit & Loss": "Profitti e perdite",
      "My Account": "Il mio account",
      "Room & Rates": "Stanza e tariffe",
      POS: "Punto vendita",
      Chat: "Chat",
    },
    pt: {
      Dashboard: "Painel",
      Reservation: "Reserva",
      Room: "Quarto",
      Rates: "Taxas",
      Bookings: "Reservas",
      Settings: "Configurações",
      Users: "Usuários",
      Currency: "Moeda",
      "Total Revenue": "Receita total",
      "Room Occupancy": "Ocupação do quarto",
      Guests: "Hóspedes",
      "Front Desk": "Recepção",
      Arrivals: "Chegadas",
      Departures: "Partidas",
      Financials: "Financeiro",
      "Upgrade to Pro": "Atualizar para Pro",
      "Log Out": "Sair",
      "from last month": "do mês passado",
      "Room Types": "Tipos de quarto",
      Channels: "Canais",
      Purchases: "Compras",
      Expenses: "Despesas",
      Payables: "A pagar",
      Receivables: "A receber",
      "Profit and Loss": "Lucros e perdas",
      Taxes: "Impostos",
      "Travel Agents": "Agentes de viagem",
      Suppliers: "Fornecedores",
      Account: "Conta",
      Billing: "Faturamento",
      Notifications: "Notificações",
      "Profit & Loss": "Lucros e perdas",
      "My Account": "Minha conta",
      "Room & Rates": "Quarto e tarifas",
      POS: "Ponto de Venda",
      Chat: "Chat",
    },
    zh: {
      Dashboard: "仪表板",
      Reservation: "预订",
      Room: "房间",
      Rates: "价格",
      Bookings: "预定",
      Settings: "设置",
      Users: "用户",
      Currency: "货币",
      "Total Revenue": "总收入",
      "Room Occupancy": "房间入住率",
      Guests: "宾客",
      "Front Desk": "前台",
      Arrivals: "到达",
      Departures: "离开",
      Financials: "财务",
      "Upgrade to Pro": "升级到专业版",
      "Log Out": "退出登录",
      "from last month": "上个月以来",
      "Room Types": "房型",
      Channels: "渠道",
      Purchases: "采购",
      Expenses: "支出",
      Payables: "应付款项",
      Receivables: "应收账款",
      "Profit and Loss": "损益",
      Taxes: "税收",
      "Travel Agents": "旅行社",
      Suppliers: "供应商",
      Account: "账户",
      Billing: "账单",
      Notifications: "通知",
      "Profit & Loss": "损益",
      "My Account": "我的账户",
      "Room & Rates": "房间和价格",
      POS: "销售点",
      Chat: "聊天",
    },
    ja: {
      Dashboard: "ダッシュボード",
      Reservation: "予約",
      Room: "部屋",
      Rates: "料金",
      Bookings: "予約一覧",
      Settings: "設定",
      Users: "ユーザー",
      Currency: "通貨",
      "Total Revenue": "総収入",
      "Room Occupancy": "部屋の占有率",
      Guests: "ゲスト",
      "Front Desk": "フロント",
      Arrivals: "到着",
      Departures: "出発",
      Financials: "財務",
      "Upgrade to Pro": "プロにアップグレード",
      "Log Out": "ログアウト",
      "from last month": "先月から",
      "Room Types": "部屋タイプ",
      Channels: "チャンネル",
      Purchases: "購入",
      Expenses: "経費",
      Payables: "買掛金",
      Receivables: "売掛金",
      "Profit and Loss": "損益",
      Taxes: "税金",
      "Travel Agents": "旅行代理店",
      Suppliers: "仕入先",
      Account: "アカウント",
      Billing: "請求",
      Notifications: "通知",
      "Profit & Loss": "損益",
      "My Account": "マイアカウント",
      "Room & Rates": "部屋と料金",
      POS: "POSシステム",
      Chat: "チャット",
    },
    ar: {
      Dashboard: "لوحة القيادة",
      Reservation: "حجز",
      Room: "غرفة",
      Rates: "الأسعار",
      Bookings: "الحجوزات",
      Settings: "الإعدادات",
      Users: "المستخدمون",
      Currency: "العملة",
      "Total Revenue": "إجمالي الإيرادات",
      "Room Occupancy": "إشغال الغرف",
      Guests: "ضيوف",
      "Front Desk": "الاستقبال",
      Arrivals: "الوصول",
      Departures: "المغادرة",
      Financials: "المالية",
      "Upgrade to Pro": "الترقية إلى برو",
      "Log Out": "تسجيل الخروج",
      "from last month": "من الشهر الماضي",
      "Room Types": "أنواع الغرف",
      Channels: "القنوات",
      Purchases: "المشتريات",
      Expenses: "النفقات",
      Payables: "المدفوعات",
      Receivables: "المقبوضات",
      "Profit and Loss": "الأرباح والخسائر",
      Taxes: "الضرائب",
      "Travel Agents": "وكلاء السفر",
      Suppliers: "الموردون",
      Account: "الحساب",
      Billing: "الفواتير",
      Notifications: "الإشعارات",
      "Profit & Loss": "الأرباح والخسائر",
      "My Account": "حسابي",
      "Room & Rates": "الغرفة والأسعار",
      POS: "نقطة البيع",
      Chat: "دردشة",
    },
    ru: {
      Dashboard: "Панель управления",
      Reservation: "Бронирование",
      Room: "Комната",
      Rates: "Тарифы",
      Bookings: "Бронирования",
      Settings: "Настройки",
      Users: "Пользователи",
      Currency: "Валюта",
      "Total Revenue": "Общий доход",
      "Room Occupancy": "Занятость номеров",
      Guests: "Гости",
      "Front Desk": "Стойка регистрации",
      Arrivals: "Прибытия",
      Departures: "Отъезды",
      Financials: "Финансы",
      "Upgrade to Pro": "Обновить до Pro",
      "Log Out": "Выйти",
      "from last month": "с прошлого месяца",
      "Room Types": "Типы номеров",
      Channels: "Каналы",
      Purchases: "Покупки",
      Expenses: "Расходы",
      Payables: "Кредиторская задолженность",
      Receivables: "Дебиторская задолженность",
      "Profit and Loss": "Прибыль и убыток",
      Taxes: "Налоги",
      "Travel Agents": "Туристические агентства",
      Suppliers: "Поставщики",
      Account: "Аккаунт",
      Billing: "Выставление счетов",
      Notifications: "Уведомления",
      "Profit & Loss": "Прибыль и убыток",
      "My Account": "Мой аккаунт",
      "Room & Rates": "Комната и тарифы",
      POS: "POS-терминал",
      Chat: "Чат",
    },
    si: {
      Dashboard: "උපකරණ පුවරුව",
      Reservation: "වෙන්කිරීම",
      Room: "කාමරය",
      Rates: "අනුපාතික",
      Bookings: "වෙන්කිරීම්",
      Settings: "සැකසුම්",
      Users: "පරිශීලකයින්",
      Currency: "මුදල් ඒකකය",
      "Total Revenue": "මුළු ආදායම",
      "Room Occupancy": "කාමර භාවිතය",
      Guests: "අමුත්තන්",
      "Front Desk": "උපකාරක මේසය",
      Arrivals: "පැමිණීම්",
      Departures: "පිටවීම්",
      Financials: "මූල්‍ය",
      "Upgrade to Pro": "Pro වෙත නව්‍ය කරන්න",
      "Log Out": "පිටවන්න",
      "from last month": "පසුගිය මාසයෙන්",
      "Room Types": "කාමර වර්ග",
      Channels: "නාලිකා",
      Purchases: "මිලදී ගැනීම්",
      Expenses: "වැය",
      Payables: "ගෙවිය යුතු",
      Receivables: "ලැබිය හැකි",
      "Profit and Loss": "ලාභ හා පාඩු",
      Taxes: "බදු",
      "Travel Agents": "ගමන් ඒජන්සි",
      Suppliers: "සැපයුම්කරුවන්",
      Account: "ගිණුම",
      Billing: "බිල්පත් කිරීම",
      Notifications: "දැනුම්දීම්",
      "Profit & Loss": "ලාභ හා පාඩු",
      "My Account": "මගේ ගිණුම",
      "Room & Rates": "කාමරය සහ අනුපාතික",
      POS: "විකුණුම් ස්ථානය",
      Chat: "කතාබස්",
    },
    hi: {
      Dashboard: "डैशबोर्ड",
      Reservation: "आरक्षण",
      Room: "कमरा",
      Rates: "दरें",
      Bookings: "बुकिंग्स",
      Settings: "सेटिंग्स",
      Users: "उपयोगकर्ता",
      Currency: "मुद्रा",
      "Total Revenue": "कुल राजस्व",
      "Room Occupancy": "कमरे की उपलब्धता",
      Guests: "मेहमान",
      "Front Desk": "फ्रंट डेस्क",
      Arrivals: "आगमन",
      Departures: "प्रस्थान",
      Financials: "वित्तीय",
      "Upgrade to Pro": "प्रो में अपग्रेड करें",
      "Log Out": "लॉग आउट",
      "from last month": "पिछले महीने से",
      "Room Types": "कमरे के प्रकार",
      Channels: "चैनल",
      Purchases: "खरीदारी",
      Expenses: "खर्च",
      Payables: "देय राशि",
      Receivables: "प्राप्तियाँ",
      "Profit and Loss": "लाभ और हानि",
      Taxes: "कर",
      "Travel Agents": "यात्रा एजेंट",
      Suppliers: "आपूर्तिकर्ता",
      Account: "खाता",
      Billing: "बिलिंग",
      Notifications: "सूचनाएं",
      "Profit & Loss": "लाभ और हानि",
      "My Account": "मेरा खाता",
      "Room & Rates": "कमरा और दरें",
      POS: "बिक्री बिंदु",
      Chat: "चैट",
    },
  }

  if (!commonPhrases[targetLang]) return text
  if (commonPhrases[targetLang][text]) return commonPhrases[targetLang][text]

  let translatedText = text
  Object.entries(commonPhrases[targetLang]).forEach(([phrase, translation]) => {
    const regex = new RegExp(`\\b${phrase}\\b`, "g")
    translatedText = translatedText.replace(regex, translation)
  })

  return translatedText
}

// Translate text using simulation
export async function translateText(text: string, targetLang: string, sourceLang = "en") {
  if (targetLang === sourceLang) return text
  if (translationCache[targetLang]?.[text]) return translationCache[targetLang][text]

  try {
    const translatedText = await simulateTranslation(text, targetLang)
    if (!translationCache[targetLang]) translationCache[targetLang] = {}
    translationCache[targetLang][text] = translatedText
    return translatedText
  } catch (error) {
    console.error("Translation error:", error)
    return text
  }
}

// Translation context
type TranslationContextType = {
  currentLanguage: string
  setLanguage: (lang: string) => void
  translate: (text: string) => Promise<string>
  t: (text: string) => string
  isLoading: boolean
}

const TranslationContext = createContext<TranslationContextType>({
  currentLanguage: "en",
  setLanguage: () => {},
  translate: async (text) => text,
  t: (text) => text,
  isLoading: false,
})

// Provider
export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState("en")
  const [translations, setTranslations] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  const setLanguage = (lang: string) => {
    setCurrentLanguage(lang)
    if (typeof window !== "undefined") {
      localStorage.setItem("preferredLanguage", lang)
    }
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLanguage = localStorage.getItem("preferredLanguage")
      if (savedLanguage) setCurrentLanguage(savedLanguage)
    }
  }, [])

  const translate = async (text: string) => {
    if (currentLanguage === "en") return text
    return translateText(text, currentLanguage)
  }

  const t = (text: string) => {
    if (currentLanguage === "en") return text
    return translations[text] || text
  }

  return (
    <TranslationContext.Provider value={{ currentLanguage, setLanguage, translate, t, isLoading }}>
      {children}
    </TranslationContext.Provider>
  )
}

// Hooks
export function useTranslation() {
  const context = useContext(TranslationContext)
  if (!context) throw new Error("useTranslation must be used within a TranslationProvider")
  return context
}

export function useTranslatedText(text: string) {
  const { currentLanguage, translate } = useTranslation()
  const [translatedText, setTranslatedText] = useState(text)

  useEffect(() => {
    let isMounted = true
    const doTranslate = async () => {
      const result = await translate(text)
      if (isMounted) setTranslatedText(result)
    }
    doTranslate()
    return () => {
      isMounted = false
    }
  }, [text, currentLanguage, translate])

  return translatedText
}
