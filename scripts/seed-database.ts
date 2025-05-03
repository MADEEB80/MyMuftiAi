import { db } from "@/lib/firebase"
import { collection, addDoc, getDocs, query, where, serverTimestamp } from "firebase/firestore"

// Sample categories
const categories = [
  {
    name: "Prayer (Salah)",
    description: "Questions related to prayer times, methods, and rulings",
    icon: "pray",
    language: "en",
  },
  {
    name: "Fasting (Sawm)",
    description: "Questions about Ramadan, fasting rules, and exemptions",
    icon: "moon",
    language: "en",
  },
  {
    name: "Zakat and Charity",
    description: "Questions about obligatory charity, voluntary charity, and related rulings",
    icon: "hand-heart",
    language: "en",
  },
  {
    name: "Marriage and Family",
    description: "Questions about marriage, divorce, family relations, and inheritance",
    icon: "users",
    language: "en",
  },
  {
    name: "Business and Finance",
    description: "Questions about halal investments, interest, business ethics, and financial transactions",
    icon: "briefcase",
    language: "en",
  },
  {
    name: "نماز",
    description: "نماز کے اوقات، طریقوں اور احکامات سے متعلق سوالات",
    icon: "pray",
    language: "ur",
  },
  {
    name: "روزہ",
    description: "رمضان، روزے کے قواعد اور استثناء کے بارے میں سوالات",
    icon: "moon",
    language: "ur",
  },
  {
    name: "زکاۃ اور صدقہ",
    description: "واجب صدقہ، رضاکارانہ صدقہ اور متعلقہ احکامات کے بارے میں سوالات",
    icon: "hand-heart",
    language: "ur",
  },
  {
    name: "شادی اور خاندان",
    description: "شادی، طلاق، خاندانی تعلقات اور وراثت کے بارے میں سوالات",
    icon: "users",
    language: "ur",
  },
  {
    name: "کاروبار اور مالیات",
    description: "حلال سرمایہ کاری، سود، کاروباری اخلاقیات اور مالی لین دین کے بارے میں سوالات",
    icon: "briefcase",
    language: "ur",
  },
]

// Sample questions
const sampleQuestions = [
  // English questions
  {
    title: "Is it permissible to combine prayers while traveling?",
    content:
      "I will be traveling for business and wondering if I can combine Zuhr and Asr prayers, as well as Maghrib and Isha prayers during my journey. What are the conditions for combining prayers?",
    status: "answered",
    language: "en",
    categoryName: "Prayer (Salah)",
    answer:
      "Yes, it is permissible to combine prayers while traveling according to the majority of scholars. You can combine Zuhr with Asr, and Maghrib with Isha, either by performing them together at the time of the earlier prayer (jam' taqdeem) or at the time of the later prayer (jam' ta'kheer). The distance of travel that permits shortening and combining prayers is approximately 48 miles (80 kilometers) according to many scholars. Remember that the prayers are combined but each prayer maintains its specific number of rak'ahs.",
  },
  {
    title: "Can I break my fast due to illness?",
    content:
      "I have a chronic medical condition that makes fasting difficult. Am I allowed to break my fast during Ramadan? If so, what are my obligations?",
    status: "answered",
    language: "en",
    categoryName: "Fasting (Sawm)",
    answer:
      "Yes, if you have a chronic medical condition that makes fasting difficult or harmful to your health, you are permitted to break your fast. The Quran states: 'Allah intends for you ease and does not intend for you hardship' (2:185). If your condition is temporary, you should make up the missed fasts when you recover. If your condition is permanent or long-term where recovery is not expected, you should pay fidyah (feeding a poor person) for each day missed. Always consult with both medical professionals and knowledgeable scholars about your specific situation.",
  },
  {
    title: "How is Zakat calculated on gold jewelry?",
    content:
      "I own some gold jewelry that I wear occasionally. Do I need to pay Zakat on it? If yes, how do I calculate the amount?",
    status: "answered",
    language: "en",
    categoryName: "Zakat and Charity",
    answer:
      "According to the majority of scholars, gold jewelry is subject to Zakat if it reaches the nisab (minimum threshold), which is approximately 85 grams of gold. If you've owned the jewelry for a full lunar year and its value meets or exceeds the nisab, you should pay 2.5% of its current market value as Zakat. Some scholars make an exception for jewelry that is regularly worn and not kept as an investment. If you follow this opinion, you may not need to pay Zakat on jewelry that is for personal use. It's recommended to consult with a knowledgeable scholar regarding your specific situation.",
  },
  {
    title: "Is online marriage contract valid in Islam?",
    content:
      "Due to distance constraints, we are considering having our nikah (Islamic marriage contract) conducted online with witnesses present on both sides. Is this valid according to Islamic law?",
    status: "answered",
    language: "en",
    categoryName: "Marriage and Family",
    answer:
      "An online nikah can be valid if it fulfills all the essential requirements of an Islamic marriage contract: 1) Consent of both parties, 2) Presence of witnesses (two male witnesses or one male and two female witnesses), 3) Offer and acceptance (ijab and qabool) in the same session, and 4) Mahr (dowry) specified. The key issue is that both parties must be able to hear and understand each other clearly, and the witnesses must be able to confirm the identities of the parties and hear the offer and acceptance. Many contemporary scholars allow this with proper verification of identities and clear communication. However, you should also ensure that your marriage is legally recognized in your respective countries, which may require additional steps beyond the religious ceremony.",
  },
  {
    title: "Is cryptocurrency investment halal?",
    content:
      "I'm considering investing in Bitcoin and other cryptocurrencies. Are these investments permissible in Islam? What should I be aware of from an Islamic perspective?",
    status: "answered",
    language: "en",
    categoryName: "Business and Finance",
    answer:
      "The permissibility of cryptocurrency investment is a contemporary issue with differing scholarly opinions. Those who permit it argue that cryptocurrencies have real utility and value, similar to other currencies. Those who caution against it point to concerns about excessive speculation, volatility, lack of intrinsic value, and potential use in illegal activities. If you choose to invest, consider these guidelines: 1) Avoid excessive speculation and gambling-like behavior, 2) Invest only what you can afford to lose, 3) Research thoroughly and understand what you're investing in, 4) Avoid cryptocurrencies specifically designed for haram industries, and 5) Pay Zakat on your holdings if they reach the nisab. Due to the evolving nature of this technology and varying opinions, it's advisable to consult with scholars knowledgeable in both Islamic finance and modern technology.",
  },

  // Urdu questions
  {
    title: "کیا سفر کے دوران نمازیں جمع کرنا جائز ہے؟",
    content:
      "میں کاروباری سفر پر جا رہا ہوں اور جاننا چاہتا ہوں کہ کیا میں ظہر اور عصر کی نمازیں، اور مغرب اور عشاء کی نمازیں اپنے سفر کے دوران جمع کر سکتا ہوں۔ نمازوں کو جمع کرنے کی شرائط کیا ہیں؟",
    status: "answered",
    language: "ur",
    categoryName: "نماز",
    answer:
      "جی ہاں، اکثر علماء کے مطابق سفر کے دوران نمازیں جمع کرنا جائز ہے۔ آپ ظہر کو عصر کے ساتھ، اور مغرب کو عشاء کے ساتھ جمع کر سکتے ہیں، یا تو پہلی نماز کے وقت میں (جمع تقدیم) یا بعد والی نماز کے وقت میں (جمع تاخیر)۔ بہت سے علماء کے مطابق، نمازوں کو قصر اور جمع کرنے کی اجازت دینے والے سفر کی دوری تقریباً 48 میل (80 کلومیٹر) ہے۔ یاد رکھیں کہ نمازیں جمع کی جاتی ہیں لیکن ہر نماز کی مخصوص رکعتوں کی تعداد برقرار رہتی ہے۔",
  },
  {
    title: "کیا میں بیماری کی وجہ سے روزہ توڑ سکتا ہوں؟",
    content:
      "مجھے ایک دائمی طبی حالت ہے جو روزہ رکھنا مشکل بناتی ہے۔ کیا مجھے رمضان کے دوران روزہ توڑنے کی اجازت ہے؟ اگر ہاں، تو میرے فرائض کیا ہیں؟",
    status: "answered",
    language: "ur",
    categoryName: "روزہ",
    answer:
      "جی ہاں، اگر آپ کو کوئی دائمی طبی حالت ہے جو روزہ رکھنا مشکل یا آپ کی صحت کے لیے نقصان دہ بناتی ہے، تو آپ کو روزہ توڑنے کی اجازت ہے۔ قرآن میں کہا گیا ہے: 'اللہ آپ کے لیے آسانی چاہتا ہے اور آپ کے لیے مشکل نہیں چاہتا' (2:185)۔ اگر آپ کی حالت عارضی ہے، تو آپ کو صحت یاب ہونے پر چھوٹے ہوئے روزے پورے کرنے چاہئیں۔ اگر آپ کی حالت مستقل یا طویل مدتی ہے جہاں صحت یابی کی توقع نہیں ہے، تو آپ کو ہر چھوٹے ہوئے دن کے لیے فدیہ (ایک غریب شخص کو کھانا کھلانا) ادا کرنا چاہیے۔ ہمیشہ اپنی مخصوص صورتحال کے بارے میں طبی پیشہ ور افراد اور علم رکھنے والے علماء دونوں سے مشورہ کریں۔",
  },
  {
    title: "سونے کے زیورات پر زکاۃ کیسے حساب کی جاتی ہے؟",
    content:
      "میرے پاس کچھ سونے کے زیورات ہیں جو میں کبھی کبھار پہنتی ہوں۔ کیا مجھے ان پر زکاۃ ادا کرنے کی ضرورت ہے؟ اگر ہاں، تو میں رقم کا حساب کیسے کروں؟",
    status: "answered",
    language: "ur",
    categoryName: "زکاۃ اور صدقہ",
    answer:
      "اکثر علماء کے مطابق، سونے کے زیورات پر زکاۃ واجب ہے اگر وہ نصاب (کم از کم حد) تک پہنچ جائیں، جو تقریباً 85 گرام سونا ہے۔ اگر آپ نے زیورات ایک مکمل چاند کے سال تک رکھے ہیں اور ان کی قیمت نصاب کے برابر یا اس سے زیادہ ہے، تو آپ کو ان کی موجودہ مارکیٹ ویلیو کا 2.5% زکاۃ کے طور پر ادا کرنا چاہیے۔ کچھ علماء ان زیورات کے لیے استثناء قائم کرتے ہیں جو ب��قاعدگی سے پہنے جاتے ہیں اور سرمایہ کاری کے طور پر نہیں رکھے جاتے۔ اگر آپ اس رائے کی پیروی کرتے ہیں، تو آپ کو ذاتی استعمال کے لیے زیورات پر زکاۃ ادا کرنے کی ضرورت نہیں ہو سکتی۔ آپ کی مخصوص صورتحال کے بارے میں علم رکھنے والے عالم سے مشورہ کرنا مستحسن ہے۔",
  },
  {
    title: "کیا آن لائن نکاح اسلام میں درست ہے؟",
    content:
      "فاصلے کی پابندیوں کی وجہ سے، ہم اپنا نکاح (اسلامی شادی کا معاہدہ) آن لائن کروانے پر غور کر رہے ہیں جس میں دونوں طرف گواہ موجود ہوں۔ کیا یہ اسلامی قانون کے مطابق درست ہے؟",
    status: "answered",
    language: "ur",
    categoryName: "شادی اور خاندان",
    answer:
      "آن لائن نکاح درست ہو سکتا ہے اگر یہ اسلامی شادی کے معاہدے کی تمام ضروری شرائط کو پورا کرتا ہے: 1) دونوں فریقین کی رضامندی، 2) گواہوں کی موجودگی (دو مرد گواہ یا ایک مرد اور دو خواتین گواہ)، 3) ایک ہی نشست میں پیشکش اور قبولیت (ایجاب اور قبول)، اور 4) مہر (جہیز) کی تعیین۔ اہم مسئلہ یہ ہے کہ دونوں فریقین ایک دوسرے کو واضح طور پر سن اور سمجھ سکیں، اور گواہ فریقین کی شناخت کی تصدیق کر سکیں اور پیشکش اور قبولیت کو سن سکیں۔ بہت سے معاصر علماء شناخت کی مناسب تصدیق اور واضح مواصلت کے ساتھ اس کی اجازت دیتے ہیں۔ تاہم، آپ کو یہ بھی یقینی بنانا چاہیے کہ آپ کی شادی آپ کے متعلقہ ممالک میں قانونی طور پر تسلیم شدہ ہے، جس کے لیے مذہبی تقریب کے علاوہ اضافی اقدامات کی ضرورت ہو سکتی ہے۔",
  },
  {
    title: "کیا کرپٹوکرنسی میں سرمایہ کاری حلال ہے؟",
    content:
      "میں بٹ کوائن اور دیگر کرپٹوکرنسیز میں سرمایہ کاری پر غور کر رہا ہوں۔ کیا یہ سرمایہ کاری اسلام میں جائز ہے؟ اسلامی نقطہ نظر سے مجھے کن باتوں سے آگاہ ہونا چاہیے؟",
    status: "answered",
    language: "ur",
    categoryName: "کاروبار اور مالیات",
    answer:
      "کرپٹوکرنسی میں سرمایہ کاری کی جواز ایک معاصر مسئلہ ہے جس پر علماء کی مختلف آراء ہیں۔ جو اسے جائز قرار دیتے ہیں وہ دلیل دیتے ہیں کہ کرپٹوکرنسیز میں حقیقی افادیت اور قیمت ہوتی ہے، دیگر کرنسیوں کی طرح۔ جو اس کے خلاف خبردار کرتے ہیں وہ حد سے زیادہ قیاس آرائی، غیر مستحکم ہونے، ذاتی قیمت کی کمی، اور غیر قانونی سرگرمیوں میں استعمال کے امکان کے بارے میں خدشات کا اظہار کرتے ہیں۔ اگر آپ سرمایہ کاری کا انتخاب کرتے ہیں، تو ان رہنما اصولوں پر غور کریں: 1) حد ��ے زیادہ قیاس آرائی اور جوئے جیسے رویے سے بچیں، 2) صرف وہی سرمایہ کاری کریں جسے آپ کھو سکتے ہیں، 3) اچھی طرح سے تحقیق کریں اور سمجھیں کہ آپ کس چیز میں سرمایہ کاری کر رہے ہیں، 4) ایسی کرپٹوکرنسیز سے بچیں جو خاص طور پر حرام صنعتوں کے لیے ڈیزائن کی گئی ہیں، اور 5) اگر آپ کی ہولڈنگز نصاب تک پہنچ جائیں تو ان پر زکاۃ ادا کریں۔ اس ٹیکنالوجی کی ارتقائی نوعیت اور مختلف آراء کی وجہ سے، اسلامی فنانس اور جدید ٹیکنالوجی دونوں میں علم رکھنے والے علماء سے مشورہ کرنا مناسب ہے۔",
  },
]

// Function to add categories to Firestore
async function addCategories() {
  console.log("Adding categories...")

  for (const category of categories) {
    // Check if category already exists
    const categoryQuery = query(
      collection(db, "categories"),
      where("name", "==", category.name),
      where("language", "==", category.language),
    )

    const existingCategories = await getDocs(categoryQuery)

    if (existingCategories.empty) {
      await addDoc(collection(db, "categories"), {
        ...category,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      console.log(`Added category: ${category.name}`)
    } else {
      console.log(`Category already exists: ${category.name}`)
    }
  }

  console.log("Categories added successfully!")
}

// Function to add questions to Firestore
async function addQuestions() {
  console.log("Adding questions...")

  for (const question of sampleQuestions) {
    // Find the category ID
    const categoryQuery = query(
      collection(db, "categories"),
      where("name", "==", question.categoryName),
      where("language", "==", question.language),
    )

    const categorySnapshot = await getDocs(categoryQuery)

    if (!categorySnapshot.empty) {
      const categoryId = categorySnapshot.docs[0].id

      // Check if question already exists
      const questionQuery = query(
        collection(db, "questions"),
        where("title", "==", question.title),
        where("language", "==", question.language),
      )

      const existingQuestions = await getDocs(questionQuery)

      if (existingQuestions.empty) {
        // Add the question
        const questionRef = await addDoc(collection(db, "questions"), {
          title: question.title,
          content: question.content,
          status: question.status,
          language: question.language,
          categoryId: categoryId,
          userId: "system",
          userName: "System",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })

        // If the question has an answer, add it
        if (question.answer) {
          await addDoc(collection(db, "answers"), {
            questionId: questionRef.id,
            content: question.answer,
            userId: "system",
            userName: "System Scholar",
            language: question.language,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })
        }

        console.log(`Added question: ${question.title}`)
      } else {
        console.log(`Question already exists: ${question.title}`)
      }
    } else {
      console.log(`Category not found for question: ${question.title}`)
    }
  }

  console.log("Questions added successfully!")
}

// Main function to seed the database
export async function seedDatabase() {
  try {
    await addCategories()
    await addQuestions()
    return { success: true, message: "Database seeded successfully!" }
  } catch (error) {
    console.error("Error seeding database:", error)
    return { success: false, message: "Error seeding database" }
  }
}
