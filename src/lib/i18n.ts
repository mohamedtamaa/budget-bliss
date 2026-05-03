import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
  en: {
    translation: {
      app: { title: "Money Manager", pro: "PRO", signedInAs: "Signed in as", signOut: "Sign out" },
      nav: {
        dashboard: "Dashboard", transactions: "Transactions", recurring: "Recurring",
        subscriptions: "Subscriptions", loans: "Loans", cards: "Credit Cards",
        accounts: "Accounts", insights: "AI Insights", settings: "Settings", guide: "Guide",
      },
      common: {
        save: "Save", cancel: "Cancel", delete: "Delete", edit: "Edit", add: "Add",
        loading: "Loading...", language: "Language", english: "English", arabic: "العربية",
      },
      ai: {
        title: "AI Financial Advisor",
        period: "Period",
        daily: "Daily", weekly: "Weekly", monthly: "Monthly",
        questionLabel: "Ask a specific question (optional)",
        questionPlaceholder: "e.g. What subscriptions should I cancel? How can I save more?",
        getInsights: "Get AI Insights",
        analyzing: "Analyzing your data...",
        recommendations: "Recommendations",
        spendingByCategory: "Spending by Category",
        incomeVsExpense: "Income vs Expenses",
        topActions: "Top Actions",
        noData: "No data for this period yet.",
        income: "Income", expense: "Expense", net: "Net",
      },
    },
  },
  ar: {
    translation: {
      app: { title: "مدير الأموال", pro: "احترافي", signedInAs: "تم تسجيل الدخول باسم", signOut: "تسجيل الخروج" },
      nav: {
        dashboard: "اللوحة", transactions: "المعاملات", recurring: "المتكررة",
        subscriptions: "الاشتراكات", loans: "القروض", cards: "البطاقات الائتمانية",
        accounts: "الحسابات", insights: "تحليلات الذكاء الاصطناعي", settings: "الإعدادات", guide: "الدليل",
      },
      common: {
        save: "حفظ", cancel: "إلغاء", delete: "حذف", edit: "تعديل", add: "إضافة",
        loading: "جاري التحميل...", language: "اللغة", english: "English", arabic: "العربية",
      },
      ai: {
        title: "المستشار المالي الذكي",
        period: "الفترة",
        daily: "يومي", weekly: "أسبوعي", monthly: "شهري",
        questionLabel: "اطرح سؤالاً محدداً (اختياري)",
        questionPlaceholder: "مثال: ما الاشتراكات التي يجب إلغاؤها؟ كيف أوفر أكثر؟",
        getInsights: "احصل على التحليل",
        analyzing: "جاري تحليل بياناتك...",
        recommendations: "التوصيات",
        spendingByCategory: "الإنفاق حسب الفئة",
        incomeVsExpense: "الدخل مقابل المصروفات",
        topActions: "أهم الإجراءات",
        noData: "لا توجد بيانات لهذه الفترة بعد.",
        income: "الدخل", expense: "المصروفات", net: "الصافي",
      },
    },
  },
};

i18n.use(LanguageDetector).use(initReactI18next).init({
  resources,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  detection: { order: ["localStorage", "navigator"], caches: ["localStorage"] },
});

const applyDir = (lng: string) => {
  const dir = lng === "ar" ? "rtl" : "ltr";
  document.documentElement.dir = dir;
  document.documentElement.lang = lng;
};
applyDir(i18n.language || "en");
i18n.on("languageChanged", applyDir);

export default i18n;
