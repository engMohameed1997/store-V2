export interface SubDistrict {
  name: string;
}

export interface District {
  name: string;
  subDistricts: SubDistrict[];
}

export interface Governorate {
  name: string;
  districts: District[];
}

export const IRAQ_GOVERNORATES: Governorate[] = [
  {
    name: "بغداد",
    districts: [
      { name: "الرصافة", subDistricts: [{ name: "الأعظمية" }, { name: "الصدر الأولى" }, { name: "الصدر الثانية" }, { name: "الرصافة المركز" }, { name: "بغداد الجديدة" }, { name: "الكرادة" }, { name: "المعامل" }, { name: "فلسطين" }, { name: "الشعب" }, { name: "الأمين" }] },
      { name: "الكرخ", subDistricts: [{ name: "الكاظمية" }, { name: "المنصور" }, { name: "الكرخ المركز" }, { name: "الشعلة" }, { name: "الدورة" }, { name: "الغزالية" }, { name: "العامرية" }, { name: "اليرموك" }, { name: "حي الجهاد" }, { name: "الحرية" }] },
      { name: "المحمودية", subDistricts: [{ name: "المحمودية المركز" }, { name: "اللطيفية" }, { name: "اليوسفية" }, { name: "الرشيد" }] },
      { name: "أبو غريب", subDistricts: [{ name: "أبو غريب المركز" }, { name: "النصر والسلام" }, { name: "التاجي" }] },
      { name: "المدائن", subDistricts: [{ name: "المدائن المركز" }, { name: "الوحدة" }, { name: "الجسر" }, { name: "صلاح الدين" }] },
      { name: "الطارمية", subDistricts: [{ name: "الطارمية المركز" }, { name: "المشاهدة" }] },
    ],
  },
  {
    name: "البصرة",
    districts: [
      { name: "البصرة المركز", subDistricts: [{ name: "العشار" }, { name: "البراضعية" }, { name: "الجبيلة" }, { name: "التنومة" }, { name: "الجنينة" }] },
      { name: "الزبير", subDistricts: [{ name: "الزبير المركز" }, { name: "سفوان" }, { name: "أم قصر" }] },
      { name: "أبو الخصيب", subDistricts: [{ name: "أبو الخصيب المركز" }, { name: "الفاو" }, { name: "السيبة" }] },
      { name: "القرنة", subDistricts: [{ name: "القرنة المركز" }, { name: "المدينة" }, { name: "النشوة" }] },
      { name: "شط العرب", subDistricts: [{ name: "شط العرب المركز" }, { name: "التنومة" }, { name: "الحارثة" }] },
      { name: "المدينة", subDistricts: [{ name: "المدينة المركز" }] },
      { name: "الدير", subDistricts: [{ name: "الدير المركز" }] },
    ],
  },
  {
    name: "نينوى",
    districts: [
      { name: "الموصل", subDistricts: [{ name: "الموصل المركز" }, { name: "الساحل الأيمن" }, { name: "الساحل الأيسر" }] },
      { name: "تلعفر", subDistricts: [{ name: "تلعفر المركز" }, { name: "ربيعة" }, { name: "زمار" }] },
      { name: "سنجار", subDistricts: [{ name: "سنجار المركز" }, { name: "القيروان" }, { name: "الشمال" }] },
      { name: "الحمدانية", subDistricts: [{ name: "الحمدانية المركز" }, { name: "برطلة" }, { name: "بعشيقة" }] },
      { name: "تلكيف", subDistricts: [{ name: "تلكيف المركز" }, { name: "القوش" }, { name: "وانة" }] },
      { name: "الشيخان", subDistricts: [{ name: "الشيخان المركز" }, { name: "عين سفني" }] },
      { name: "الحضر", subDistricts: [{ name: "الحضر المركز" }] },
      { name: "مخمور", subDistricts: [{ name: "مخمور المركز" }, { name: "القيارة" }, { name: "الدبس" }] },
      { name: "البعاج", subDistricts: [{ name: "البعاج المركز" }] },
    ],
  },
  {
    name: "أربيل",
    districts: [
      { name: "أربيل المركز", subDistricts: [{ name: "أربيل المركز" }, { name: "عينكاوا" }, { name: "بنصلاوة" }] },
      { name: "مخمور", subDistricts: [{ name: "مخمور المركز" }, { name: "القيارة" }] },
      { name: "شقلاوة", subDistricts: [{ name: "شقلاوة المركز" }, { name: "حرير" }] },
      { name: "سوران", subDistricts: [{ name: "سوران المركز" }, { name: "ديانا" }, { name: "رواندز" }] },
      { name: "كويسنجق", subDistricts: [{ name: "كويسنجق المركز" }, { name: "طقطق" }] },
      { name: "خبات", subDistricts: [{ name: "خبات المركز" }] },
    ],
  },
  {
    name: "السليمانية",
    districts: [
      { name: "السليمانية المركز", subDistricts: [{ name: "السليمانية المركز" }, { name: "بكرجو" }, { name: "تاينال" }] },
      { name: "حلبجة", subDistricts: [{ name: "حلبجة المركز" }, { name: "خورمال" }, { name: "سيروان" }] },
      { name: "رانية", subDistricts: [{ name: "رانية المركز" }, { name: "قلعة دزة" }, { name: "حاجياوا" }] },
      { name: "دوكان", subDistricts: [{ name: "دوكان المركز" }] },
      { name: "شارباژير", subDistricts: [{ name: "شارباژير المركز" }] },
      { name: "بنجوين", subDistricts: [{ name: "بنجوين المركز" }] },
      { name: "دربندخان", subDistricts: [{ name: "دربندخان المركز" }] },
      { name: "كلار", subDistricts: [{ name: "كلار المركز" }, { name: "خانقين" }] },
    ],
  },
  {
    name: "دهوك",
    districts: [
      { name: "دهوك المركز", subDistricts: [{ name: "دهوك المركز" }, { name: "مانكيش" }] },
      { name: "زاخو", subDistricts: [{ name: "زاخو المركز" }, { name: "إبراهيم الخليل" }, { name: "باتيفة" }] },
      { name: "العمادية", subDistricts: [{ name: "العمادية المركز" }, { name: "سرسنك" }, { name: "ديرلوك" }] },
      { name: "عقرة", subDistricts: [{ name: "عقرة المركز" }, { name: "بردرش" }] },
      { name: "سيميل", subDistricts: [{ name: "سيميل المركز" }, { name: "فايدة" }] },
      { name: "شيخان", subDistricts: [{ name: "شيخان المركز" }] },
    ],
  },
  {
    name: "كركوك",
    districts: [
      { name: "كركوك المركز", subDistricts: [{ name: "كركوك المركز" }, { name: "الملتقى" }, { name: "رحيمآوا" }] },
      { name: "الحويجة", subDistricts: [{ name: "الحويجة المركز" }, { name: "الرياض" }, { name: "العباسي" }] },
      { name: "داقوق", subDistricts: [{ name: "داقوق المركز" }, { name: "طوزخورماتو" }] },
      { name: "الدبس", subDistricts: [{ name: "الدبس المركز" }] },
    ],
  },
  {
    name: "ديالى",
    districts: [
      { name: "بعقوبة", subDistricts: [{ name: "بعقوبة المركز" }, { name: "بهرز" }, { name: "كنعان" }] },
      { name: "المقدادية", subDistricts: [{ name: "المقدادية المركز" }, { name: "أبو صيدا" }, { name: "الوجيهية" }] },
      { name: "خانقين", subDistricts: [{ name: "خانقين المركز" }, { name: "جلولاء" }, { name: "السعدية" }] },
      { name: "بلدروز", subDistricts: [{ name: "بلدروز المركز" }, { name: "مندلي" }] },
      { name: "الخالص", subDistricts: [{ name: "الخالص المركز" }, { name: "هبهب" }, { name: "أبو خنازير" }] },
      { name: "كفري", subDistricts: [{ name: "كفري المركز" }] },
    ],
  },
  {
    name: "الأنبار",
    districts: [
      { name: "الرمادي", subDistricts: [{ name: "الرمادي المركز" }, { name: "الحبانية" }, { name: "الخالدية" }] },
      { name: "الفلوجة", subDistricts: [{ name: "الفلوجة المركز" }, { name: "العامرية" }, { name: "الكرمة" }] },
      { name: "هيت", subDistricts: [{ name: "هيت المركز" }, { name: "كبيسة" }, { name: "البغدادي" }] },
      { name: "حديثة", subDistricts: [{ name: "حديثة المركز" }, { name: "حقلانية" }, { name: "بروانة" }] },
      { name: "عنه", subDistricts: [{ name: "عنه المركز" }, { name: "راوة" }] },
      { name: "القائم", subDistricts: [{ name: "القائم المركز" }, { name: "العبيدي" }, { name: "الكرابلة" }] },
      { name: "الرطبة", subDistricts: [{ name: "الرطبة المركز" }, { name: "النخيب" }] },
    ],
  },
  {
    name: "بابل",
    districts: [
      { name: "الحلة", subDistricts: [{ name: "الحلة المركز" }, { name: "الإمام" }, { name: "نادر" }] },
      { name: "المسيب", subDistricts: [{ name: "المسيب المركز" }, { name: "الإسكندرية" }, { name: "جرف الصخر" }, { name: "السدة" }] },
      { name: "المحاويل", subDistricts: [{ name: "المحاويل المركز" }, { name: "المشروع" }, { name: "النيل" }, { name: "الإمام" }] },
      { name: "الهاشمية", subDistricts: [{ name: "الهاشمية المركز" }, { name: "المدحتية" }, { name: "القاسم" }] },
    ],
  },
  {
    name: "كربلاء",
    districts: [
      { name: "كربلاء المركز", subDistricts: [{ name: "كربلاء المركز" }, { name: "الحسينية" }, { name: "الحر" }] },
      { name: "عين التمر", subDistricts: [{ name: "عين التمر المركز" }, { name: "الرحالية" }] },
      { name: "الهندية", subDistricts: [{ name: "الهندية المركز" }, { name: "الجدول الغربي" }, { name: "الخيرات" }] },
    ],
  },
  {
    name: "النجف",
    districts: [
      { name: "النجف المركز", subDistricts: [{ name: "النجف المركز" }, { name: "الحيدرية" }, { name: "الحنانة" }] },
      { name: "الكوفة", subDistricts: [{ name: "الكوفة المركز" }, { name: "العباسية" }, { name: "الحيرة" }] },
      { name: "المناذرة", subDistricts: [{ name: "المناذرة المركز" }, { name: "الحيرة" }, { name: "القادسية" }] },
      { name: "المشخاب", subDistricts: [{ name: "المشخاب المركز" }, { name: "القادسية" }] },
    ],
  },
  {
    name: "واسط",
    districts: [
      { name: "الكوت", subDistricts: [{ name: "الكوت المركز" }, { name: "واسط" }, { name: "شيخ سعد" }] },
      { name: "النعمانية", subDistricts: [{ name: "النعمانية المركز" }, { name: "الأحرار" }] },
      { name: "الحي", subDistricts: [{ name: "الحي المركز" }, { name: "البشائر" }, { name: "الموفقية" }] },
      { name: "بدرة", subDistricts: [{ name: "بدرة المركز" }, { name: "جصان" }, { name: "زرباطية" }] },
      { name: "الصويرة", subDistricts: [{ name: "الصويرة المركز" }, { name: "الزبيدية" }, { name: "الدبوني" }] },
      { name: "العزيزية", subDistricts: [{ name: "العزيزية المركز" }, { name: "تاج الدين" }] },
    ],
  },
  {
    name: "ميسان",
    districts: [
      { name: "العمارة", subDistricts: [{ name: "العمارة المركز" }, { name: "كميت" }, { name: "المشرح" }] },
      { name: "المجر الكبير", subDistricts: [{ name: "المجر الكبير المركز" }, { name: "سيد أحمد الرفاعي" }] },
      { name: "علي الغربي", subDistricts: [{ name: "علي الغربي المركز" }, { name: "الأحرار" }] },
      { name: "الميمونة", subDistricts: [{ name: "الميمونة المركز" }, { name: "المشرح" }] },
      { name: "قلعة صالح", subDistricts: [{ name: "قلعة صالح المركز" }] },
      { name: "الكحلاء", subDistricts: [{ name: "الكحلاء المركز" }] },
    ],
  },
  {
    name: "ذي قار",
    districts: [
      { name: "الناصرية", subDistricts: [{ name: "الناصرية المركز" }, { name: "سيد دخيل" }, { name: "البطحاء" }] },
      { name: "سوق الشيوخ", subDistricts: [{ name: "سوق الشيوخ المركز" }, { name: "الفضلية" }, { name: "كرمة بني سعيد" }] },
      { name: "الشطرة", subDistricts: [{ name: "الشطرة المركز" }, { name: "الغراف" }, { name: "الدواية" }] },
      { name: "الرفاعي", subDistricts: [{ name: "الرفاعي المركز" }, { name: "النصر" }, { name: "قلعة سكر" }] },
      { name: "الجبايش", subDistricts: [{ name: "الجبايش المركز" }] },
      { name: "الفجر", subDistricts: [{ name: "الفجر المركز" }] },
    ],
  },
  {
    name: "المثنى",
    districts: [
      { name: "السماوة", subDistricts: [{ name: "السماوة المركز" }, { name: "السوير" }, { name: "الدراجي" }] },
      { name: "الرميثة", subDistricts: [{ name: "الرميثة المركز" }, { name: "المجد" }, { name: "النجمي" }] },
      { name: "الخضر", subDistricts: [{ name: "الخضر المركز" }] },
      { name: "السلمان", subDistricts: [{ name: "السلمان المركز" }] },
    ],
  },
  {
    name: "القادسية",
    districts: [
      { name: "الديوانية", subDistricts: [{ name: "الديوانية المركز" }, { name: "السنية" }, { name: "الدغارة" }] },
      { name: "عفك", subDistricts: [{ name: "عفك المركز" }, { name: "البدير" }, { name: "سومر" }] },
      { name: "الشامية", subDistricts: [{ name: "الشامية المركز" }, { name: "المهناوية" }, { name: "غماس" }] },
      { name: "الحمزة", subDistricts: [{ name: "الحمزة المركز" }, { name: "السدير" }] },
    ],
  },
  {
    name: "صلاح الدين",
    districts: [
      { name: "تكريت", subDistricts: [{ name: "تكريت المركز" }, { name: "العلم" }, { name: "الحجاج" }] },
      { name: "سامراء", subDistricts: [{ name: "سامراء المركز" }, { name: "الدور" }, { name: "المعتصم" }] },
      { name: "بيجي", subDistricts: [{ name: "بيجي المركز" }, { name: "العيث" }, { name: "السنية" }] },
      { name: "الشرقاط", subDistricts: [{ name: "الشرقاط المركز" }, { name: "الزوية" }] },
      { name: "بلد", subDistricts: [{ name: "بلد المركز" }, { name: "الدجيل" }, { name: "يثرب" }] },
      { name: "طوزخورماتو", subDistricts: [{ name: "طوزخورماتو المركز" }, { name: "سليمان بيك" }, { name: "آمرلي" }] },
      { name: "الفارس", subDistricts: [{ name: "الفارس المركز" }] },
    ],
  },
];

/**
 * Get all governorate names
 */
export function getGovernorateNames(): string[] {
  return IRAQ_GOVERNORATES.map((g) => g.name);
}

/**
 * Get districts for a specific governorate
 */
export function getDistricts(governorateName: string): string[] {
  const gov = IRAQ_GOVERNORATES.find((g) => g.name === governorateName);
  return gov ? gov.districts.map((d) => d.name) : [];
}

/**
 * Get sub-districts for a specific governorate and district
 */
export function getSubDistricts(governorateName: string, districtName: string): string[] {
  const gov = IRAQ_GOVERNORATES.find((g) => g.name === governorateName);
  if (!gov) return [];
  const district = gov.districts.find((d) => d.name === districtName);
  return district ? district.subDistricts.map((s) => s.name) : [];
}

/**
 * Validate that a governorate name exists
 */
export function isValidGovernorate(name: string): boolean {
  return IRAQ_GOVERNORATES.some((g) => g.name === name);
}

/**
 * Validate that a district exists under a governorate
 */
export function isValidDistrict(governorateName: string, districtName: string): boolean {
  const gov = IRAQ_GOVERNORATES.find((g) => g.name === governorateName);
  if (!gov) return false;
  return gov.districts.some((d) => d.name === districtName);
}

/**
 * Validate that a sub-district exists under a governorate and district
 */
export function isValidSubDistrict(governorateName: string, districtName: string, subDistrictName: string): boolean {
  const gov = IRAQ_GOVERNORATES.find((g) => g.name === governorateName);
  if (!gov) return false;
  const district = gov.districts.find((d) => d.name === districtName);
  if (!district) return false;
  return district.subDistricts.some((s) => s.name === subDistrictName);
}
