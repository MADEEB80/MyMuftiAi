"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useMemo } from "react"

// Define the available languages
export type Language = "en" | "ur"

// Define the context type
interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  isRTL: boolean
  t: (key: string, params?: Record<string, any>) => string
}

// Simple translations for common UI elements
const translations = {
  en: {
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.success": "Success",
    "common.submit": "Submit",
    "common.cancel": "Cancel",
    "common.save": "Save",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.view": "View",
    "common.search": "Search",
    "common.filter": "Filter",
    "common.sort": "Sort",
    "common.next": "Next",
    "common.previous": "Previous",
    "common.back": "Back",
    "common.home": "Home",
    "common.dashboard": "Dashboard",
    "common.profile": "Profile",
    "common.settings": "Settings",
    "common.logout": "Logout",
    "common.login": "Login",
    "common.register": "Register",
    "common.forgotPassword": "Forgot Password",
    "common.resetPassword": "Reset Password",
    "common.changePassword": "Change Password",
    "common.email": "Email",
    "common.password": "Password",
    "common.confirmPassword": "Confirm Password",
    "common.name": "Name",
    "common.firstName": "First Name",
    "common.lastName": "Last Name",
    "common.username": "Username",
    "common.phone": "Phone",
    "common.address": "Address",
    "common.city": "City",
    "common.state": "State",
    "common.country": "Country",
    "common.zipCode": "Zip Code",
    "common.dateOfBirth": "Date of Birth",
    "common.gender": "Gender",
    "common.male": "Male",
    "common.female": "Female",
    "common.other": "Other",
    "common.yes": "Yes",
    "common.no": "No",
    "common.ok": "OK",
    "common.cancel": "Cancel",
    "common.close": "Close",
    "common.open": "Open",
    "common.show": "Show",
    "common.hide": "Hide",
    "common.add": "Add",
    "common.remove": "Remove",
    "common.create": "Create",
    "common.update": "Update",
    "common.delete": "Delete",
    "common.save": "Save",
    "common.saveChanges": "Save Changes",
    "common.discard": "Discard",
    "common.discardChanges": "Discard Changes",
    "common.apply": "Apply",
    "common.reset": "Reset",
    "common.clear": "Clear",
    "common.select": "Select",
    "common.selectAll": "Select All",
    "common.deselectAll": "Deselect All",
    "common.all": "All",
    "common.none": "None",
    "common.more": "More",
    "common.less": "Less",
    "common.showMore": "Show More",
    "common.showLess": "Show Less",
    "common.loadMore": "Load More",
    "common.refresh": "Refresh",
    "common.retry": "Retry",
    "common.skip": "Skip",
    "common.continue": "Continue",
    "common.finish": "Finish",
    "common.done": "Done",
    "common.complete": "Complete",
    "common.incomplete": "Incomplete",
    "common.pending": "Pending",
    "common.processing": "Processing",
    "common.approved": "Approved",
    "common.rejected": "Rejected",
    "common.active": "Active",
    "common.inactive": "Inactive",
    "common.enabled": "Enabled",
    "common.disabled": "Disabled",
    "common.on": "On",
    "common.off": "Off",
    "common.yes": "Yes",
    "common.no": "No",
    "common.true": "True",
    "common.false": "False",
    "common.success": "Success",
    "common.error": "Error",
    "common.warning": "Warning",
    "common.info": "Info",
    "common.notification": "Notification",
    "common.message": "Message",
    "common.alert": "Alert",
    "common.confirm": "Confirm",
    "common.confirmation": "Confirmation",
    "common.areYouSure": "Are you sure?",
    "common.thisActionCannotBeUndone": "This action cannot be undone.",
    "common.pleaseConfirm": "Please confirm",
    "common.pleaseWait": "Please wait",
    "common.loading": "Loading",
    "common.uploading": "Uploading",
    "common.downloading": "Downloading",
    "common.processing": "Processing",
    "common.saving": "Saving",
    "common.deleting": "Deleting",
    "common.updating": "Updating",
    "common.creating": "Creating",
    "common.sending": "Sending",
    "common.submitting": "Submitting",
    "common.searching": "Searching",
    "common.filtering": "Filtering",
    "common.sorting": "Sorting",
    "common.paginating": "Paginating",
    "common.navigating": "Navigating",
    "common.redirecting": "Redirecting",
    "common.pleaseWait": "Please wait",
    "common.pleaseWaitWhileWeProcess": "Please wait while we process your request",
    "common.pleaseWaitWhileWeRedirect": "Please wait while we redirect you",
    "common.pleaseWaitWhileWeLoad": "Please wait while we load the data",
    "common.pleaseWaitWhileWeSave": "Please wait while we save your changes",
    "common.pleaseWaitWhileWeDelete": "Please wait while we delete the item",
    "common.noQuestionsFound": "No questions found",
    "common.viewAllQuestions": "View all questions",
    "categories.questionCount": "{{count}} questions",
    "categories.pageTitle": "Browse by Category",
    "categories.categoriesTitle": "Categories",
    "categories.questionsTitle": "Questions",
    "categories.noQuestionsFound": "No questions found in this category",
    "categories.showingQuestions": "Showing",
    "categories.questionsInCategory": "questions in this category",
    "categories.askQuestion": "Ask a Question",
    "categories.viewAnswer": "View Answer",
    "categories.createIndexText": "Create Index",
    "categories.indexRequiredText": "This query requires a Firestore index.",
  },
  ur: {
    "common.loading": "لوڈ ہو رہا ہے...",
    "common.error": "خطا",
    "common.success": "کامیابی",
    "common.submit": "جمع کرائیں",
    "common.cancel": "منسوخ کریں",
    "common.save": "محفوظ کریں",
    "common.delete": "حذف کریں",
    "common.edit": "ترمیم کریں",
    "common.view": "دیکھیں",
    "common.search": "تلاش کریں",
    "common.filter": "فلٹر کریں",
    "common.sort": "ترتیب دیں",
    "common.next": "اگلا",
    "common.previous": "پچھلا",
    "common.back": "واپس",
    "common.home": "ہوم",
    "common.dashboard": "ڈیش بورڈ",
    "common.profile": "پروفائل",
    "common.settings": "ترتیبات",
    "common.logout": "لاگ آؤٹ",
    "common.login": "لاگ ان",
    "common.register": "رجسٹر کریں",
    "common.forgotPassword": "پاسورڈ بھول گئے",
    "common.resetPassword": "پاسورڈ ری سیٹ کریں",
    "common.changePassword": "پاسورڈ تبدیل کریں",
    "common.email": "ای میل",
    "common.password": "پاسورڈ",
    "common.confirmPassword": "پاسورڈ کی تصدیق کریں",
    "common.name": "نام",
    "common.firstName": "پہلا نام",
    "common.lastName": "آخری نام",
    "common.username": "صارف نام",
    "common.phone": "فون",
    "common.address": "پتہ",
    "common.city": "شہر",
    "common.state": "ریاست",
    "common.country": "ملک",
    "common.zipCode": "زپ کوڈ",
    "common.dateOfBirth": "تاریخ پیدائش",
    "common.gender": "جنس",
    "common.male": "مرد",
    "common.female": "عورت",
    "common.other": "دیگر",
    "common.yes": "ہاں",
    "common.no": "نہیں",
    "common.ok": "ٹھیک ہے",
    "common.cancel": "منسوخ کریں",
    "common.close": "بند کریں",
    "common.open": "کھولیں",
    "common.show": "دکھائیں",
    "common.hide": "چھپائیں",
    "common.add": "شامل کریں",
    "common.remove": "ہٹائیں",
    "common.create": "بنائیں",
    "common.update": "اپڈیٹ کریں",
    "common.delete": "حذف کریں",
    "common.save": "محفوظ کریں",
    "common.saveChanges": "تبدیلیاں محفوظ کریں",
    "common.discard": "رد کریں",
    "common.discardChanges": "تبدیلیاں رد کریں",
    "common.apply": "لاگو کریں",
    "common.reset": "ری سیٹ کریں",
    "common.clear": "صاف کریں",
    "common.select": "منتخب کریں",
    "common.selectAll": "سب منتخب کریں",
    "common.deselectAll": "سب کو غیر منتخب کریں",
    "common.all": "تمام",
    "common.none": "کوئی نہیں",
    "common.more": "مزید",
    "common.less": "کم",
    "common.showMore": "مزید دکھائیں",
    "common.showLess": "کم دکھائیں",
    "common.loadMore": "مزید لوڈ کریں",
    "common.refresh": "ریفریش کریں",
    "common.retry": "دوبارہ کوشش کریں",
    "common.skip": "چھوڑیں",
    "common.continue": "جاری رکھیں",
    "common.finish": "ختم کریں",
    "common.done": "ہو گیا",
    "common.complete": "مکمل",
    "common.incomplete": "نامکمل",
    "common.pending": "زیر التواء",
    "common.processing": "پروسیسنگ",
    "common.approved": "منظور شدہ",
    "common.rejected": "مسترد",
    "common.active": "فعال",
    "common.inactive": "غیر فعال",
    "common.enabled": "فعال",
    "common.disabled": "غیر فعال",
    "common.on": "آن",
    "common.off": "آف",
    "common.yes": "ہاں",
    "common.no": "نہیں",
    "common.true": "صحیح",
    "common.false": "غلط",
    "common.success": "کامیابی",
    "common.error": "خطا",
    "common.warning": "انتباہ",
    "common.info": "معلومات",
    "common.notification": "اطلاع",
    "common.message": "پیغام",
    "common.alert": "الرٹ",
    "common.confirm": "تصدیق کریں",
    "common.confirmation": "تصدیق",
    "common.areYouSure": "کیا آپ کو یقین ہے؟",
    "common.thisActionCannotBeUndone": "یہ عمل واپس نہیں لیا جا سکتا۔",
    "common.pleaseConfirm": "براہ کرم تصدیق کریں",
    "common.pleaseWait": "براہ کرم انتظار کریں",
    "common.loading": "لوڈ ہو رہا ہے",
    "common.uploading": "اپلوڈ ہو رہا ہے",
    "common.downloading": "ڈاؤنلوڈ ہو رہا ہے",
    "common.processing": "پروسیسنگ",
    "common.saving": "محفوظ ہو رہا ہے",
    "common.deleting": "حذف ہو رہا ہے",
    "common.updating": "اپڈیٹ ہو رہا ہے",
    "common.creating": "بن رہا ہے",
    "common.sending": "بھیجا جا رہا ہے",
    "common.submitting": "جمع ہو رہا ہے",
    "common.searching": "تلاش ہو رہا ہے",
    "common.filtering": "فلٹر ہو رہا ہے",
    "common.sorting": "ترتیب ہو رہا ہے",
    "common.paginating": "صفحہ بندی ہو رہی ہے",
    "common.navigating": "نیویگیٹ ہو رہا ہے",
    "common.redirecting": "ری ڈائریکٹ ہو رہا ہے",
    "common.pleaseWait": "براہ کرم انتظار کریں",
    "common.pleaseWaitWhileWeProcess": "براہ کرم انتظار کریں جب تک ہم آپ کی درخواست پر کارروائی کر رہے ہیں",
    "common.pleaseWaitWhileWeRedirect": "براہ کرم انتظار کریں جب تک ہم آپ کو ری ڈائریکٹ کر رہے ہیں",
    "common.pleaseWaitWhileWeLoad": "براہ کرم انتظار کریں جب تک ہم ڈیٹا لوڈ کر رہے ہیں",
    "common.pleaseWaitWhileWeSave": "براہ کرم انتظار کریں جب تک ہم آپ کی تبدیلیاں محفوظ کر رہے ہیں",
    "common.pleaseWaitWhileWeDelete": "براہ کرم انتظار کریں جب تک ہم آئٹم حذف کر رہے ہیں",
    "common.noQuestionsFound": "کوئی سوال نہیں ملا",
    "common.viewAllQuestions": "تمام سوالات دیکھیں",
    "categories.questionCount": "{{count}} سوالات",
    "categories.pageTitle": "زمرہ کے مطابق براؤز کریں",
    "categories.categoriesTitle": "زمرے",
    "categories.questionsTitle": "سوالات",
    "categories.noQuestionsFound": "اس زمرے میں کوئی سوال نہیں ملا",
    "categories.showingQuestions": "اس زمرے میں دکھا رہا ہے",
    "categories.questionsInCategory": "سوالات",
    "categories.askQuestion": "سوال پوچھیں",
    "categories.viewAnswer": "جواب دیکھیں",
    "categories.createIndexText": "انڈیکس بنائیں",
    "categories.indexRequiredText": "اس کوئری کے لیے فائر اسٹور انڈیکس کی ضرورت ہے۔",
  },
}

// Create the context with default values
const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  isRTL: false,
  t: () => "",
})

// Custom hook to use the language context
export const useLanguage = () => useContext(LanguageContext)

// Provider component
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Get initial language from localStorage if available, otherwise default to English
  const [language, setLanguage] = useState<Language>("en")

  // Determine if the current language is RTL
  const isRTL = useMemo(() => language === "ur", [language])

  // Load saved language preference from localStorage on component mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language
    if (savedLanguage && (savedLanguage === "en" || savedLanguage === "ur")) {
      setLanguage(savedLanguage)
    }
  }, [])

  // Save language preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("language", language)

    // Update the document direction based on language
    document.documentElement.dir = isRTL ? "rtl" : "ltr"
    document.documentElement.lang = language

    // Add or remove RTL class from body
    if (isRTL) {
      document.body.classList.add("rtl")
    } else {
      document.body.classList.remove("rtl")
    }
  }, [language, isRTL])

  // Translation function
  const t = (key: string, params?: Record<string, any>): string => {
    const langTranslations = translations[language] || translations.en
    let text = langTranslations[key] || translations.en[key] || key

    // Replace parameters if provided
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        text = text.replace(`{{${paramKey}}}`, String(paramValue))
      })
    }

    return text
  }

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      language,
      setLanguage,
      isRTL,
      t,
    }),
    [language, isRTL],
  )

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>
}
