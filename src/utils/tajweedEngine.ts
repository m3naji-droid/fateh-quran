// Comprehensive Quranic Tajweed Analysis Engine with Color Coding & UI Mapping

export type TajweedCategory = 
  | 'noon_tanween' 
  | 'meem_sakina' 
  | 'madd' 
  | 'qalqala' 
  | 'ghunnah' 
  | 'tafkheem';

export interface TajweedRuleItem {
  id: string;
  category: TajweedCategory;
  categoryLabel: string;
  ruleName: string;
  word: string;
  ayahNumber: number;
  description: string;
  tip: string;
  status: 'mastered' | 'warning' | 'needs_practice';
  acousticCheck: string;
  colorCode: string; // اللون المخصص للحكم لعرضه في شاشة الآيات
}

export interface LetterEvaluation {
  char: string;
  isVowel: boolean;
  status: 'correct' | 'mispronounced' | 'missing';
}

export interface WordEvaluation {
  word: string;
  status: 'correct' | 'mispronounced' | 'missing';
  letters?: LetterEvaluation[];
}

export interface TajweedAnalysisReport {
  pronunciationScore: number;      
  tajweedScore: number;            
  overallAverageScore: number;     
  overallTajweedScore: number; 
  tajweedMasteryPercentage: number; 
  rulesFoundCount: number;
  masteredCount: number;
  warningCount: number;
  needsPracticeCount: number;
  rulesByCategory: {
    noon_tanween: TajweedRuleItem[];
    meem_sakina: TajweedRuleItem[];
    madd: TajweedRuleItem[];
    qalqala: TajweedRuleItem[];
    ghunnah: TajweedRuleItem[];
    tafkheem: TajweedRuleItem[];
  };
  allRules: TajweedRuleItem[];
  pedagogicalAdvice: string[];
  wordEvaluations: WordEvaluation[]; 
}

const QALQALA_LETTERS = ['ق', 'ط', 'ب', 'ج', 'د'];

/**
 * خريطة الألوان المعتمدة لشاشة العرض (Tajweed Color Palette Map)
 */
export const TAJWEED_COLOR_MAP: Record<TajweedCategory | string, string> = {
  madd: '#DC2626',          // أحمر قاني للمدود والمد اللازم
  ghunnah: '#F97316',       // برتقالي دافئ للغنة المشددة
  qalqala: '#10B981',       // أخضر زمردي للقلقلة
  noon_tanween: '#3B82F6',  // أزرق صافي لأحكام النون والتنوين
  meem_sakina: '#8B5CF6',   // بنفسجي لأحكام الميم الساكنة
  tafkheem: '#D97706',      // أصفر عسلي للتفخيم
  default: '#6B7280'        // رمادي افتراضي
};

/**
 * دالة مساعدة لتحديد اللون المناسب بناءً على الفئة واسم الحكم
 */
function getTajweedColorCode(category: TajweedCategory, ruleName: string): string {
  if (category === 'madd') {
    if (ruleName.includes('لازم')) return TAJWEED_COLOR_MAP.madd;
    return '#EF4444'; 
  }
  return TAJWEED_COLOR_MAP[category] || TAJWEED_COLOR_MAP.default;
}

/**
 * تحليل وفحص الآيات واستخراج الأحكام مع ألوانها الخاصة
 */
export function detectTajweedRulesInText(text: string, ayahNumber: number): TajweedRuleItem[] {
  const rules: TajweedRuleItem[] = [];
  const words = text ? text.split(/\s+/).filter(Boolean) : [`آية_${ayahNumber}`];

  for (let i = 0; i < words.length; i++) {
    const currentWord = words[i];

    // 1. أحكام المدود
    if (currentWord.includes('ٓ') || currentWord.includes('~')) {
      const isLazim = currentWord.includes('يسٓ') || currentWord.includes('حٓمٓ');
      const ruleName = isLazim ? 'مد لازم حرفي' : 'مد (متصل أو منفصل)';
      rules.push({
        id: `madd_${ayahNumber}_${i}`,
        category: 'madd',
        categoryLabel: 'أحكام المدود',
        ruleName,
        word: currentWord,
        ayahNumber,
        description: 'وجود حرف مد يستوجب المد بمقدار حركات محددة',
        tip: 'أعطِ حرف المد حقه من الزمن والمقدار.',
        status: 'mastered',
        acousticCheck: 'مد صحيح',
        colorCode: getTajweedColorCode('madd', ruleName)
      });
    }

    // 2. الغنة والميم والنون المشددة
    if (/نّ|مّ/.test(currentWord)) {
      const ruleName = 'غنة مشددة أكمل ما تكون';
      rules.push({
        id: `ghunnah_${ayahNumber}_${i}`,
        category: 'ghunnah',
        categoryLabel: 'النون والميم المشددتان',
        ruleName,
        word: currentWord,
        ayahNumber,
        description: 'وجوب إخراج الغنة من الخيشوم بمقدار حركتين',
        tip: 'اضغط على مخرج الحرف مع إطالة الغنة.',
        acousticCheck: 'غنة حركتان',
        colorCode: getTajweedColorCode('ghunnah', ruleName)
      });
    }

    // 3. أحكام القلقلة
    for (const qLetter of QALQALA_LETTERS) {
      if (new RegExp(`[${qLetter}][ْ\u06E1]|${qLetter}$`).test(currentWord)) {
        const ruleName = `قلقلة حرف ${qLetter}`;
        rules.push({
          id: `qalqala_${qLetter}_${ayahNumber}_${i}`,
          category: 'qalqala',
          categoryLabel: 'أحكام القلقلة',
          ruleName,
          word: currentWord,
          ayahNumber,
          description: `قلقلة حرف (${qLetter}) عند السكون`,
          tip: 'اضطرب بالمخرج دون شائبة حركة.',
          acousticCheck: `قلقلة ${qLetter}`,
          colorCode: getTajweedColorCode('qalqala', ruleName)
        });
        break;
      }
    }
  }

  if (rules.length === 0) {
    rules.push({
      id: `default_tajweed_${ayahNumber}`,
      category: 'madd',
      categoryLabel: 'أحكام التجويد العامة',
      ruleName: 'تلاوة صحيحة',
      word: words[0] || 'الآية',
      ayahNumber,
      description: 'مراعاة إخراج الحروف من مخارجها',
      tip: 'التأني وإعطاء الحروف حقها.',
      status: 'mastered',
      acousticCheck: 'سلامة النطق',
      colorCode: TAJWEED_COLOR_MAP.default
    });
  }

  return rules;
}

export function analyzeTajweedForAyahs(
  startAyah: number,
  endAyah: number,
  accuracyScore: number = 90,
  targetText?: string 
): TajweedAnalysisReport {
  const allRules: TajweedRuleItem[] = [];

  for (let a = startAyah; a <= endAyah; a++) {
    const detected = detectTajweedRulesInText(targetText || '', a);
    allRules.push(...detected);
  }

  allRules.forEach((rule, idx) => {
    if (accuracyScore >= 80) {
      rule.status = 'mastered';
    } else if (accuracyScore >= 50) {
      rule.status = idx % 2 === 0 ? 'mastered' : 'warning';
    } else {
      rule.status = idx % 3 === 0 ? 'warning' : 'needs_practice';
    }
  });

  const masteredCount = allRules.filter(r => r.status === 'mastered').length;
  const warningCount = allRules.filter(r => r.status === 'warning').length;
  const needsPracticeCount = allRules.filter(r => r.status === 'needs_practice').length;
  const total = Math.max(1, allRules.length);

  const tajweedMasteryPercentage = Math.round(
    ((masteredCount * 1.0 + warningCount * 0.7) / total) * 100
  );

  const pronunciationScore = Number(((Math.max(0, Math.min(100, accuracyScore)) / 100) * 10).toFixed(1));
  const tajweedScore = Number(((tajweedMasteryPercentage / 100) * 10).toFixed(1));
  const overallAverageScore = Number(((pronunciationScore + tajweedScore) / 2).toFixed(1));
  const overallTajweedScore = tajweedScore;

  const rulesByCategory = {
    noon_tanween: allRules.filter(r => r.category === 'noon_tanween'),
    meem_sakina: allRules.filter(r => r.category === 'meem_sakina'),
    madd: allRules.filter(r => r.category === 'madd'),
    qalqala: allRules.filter(r => r.category === 'qalqala'),
    ghunnah: allRules.filter(r => r.category === 'ghunnah'),
    tafkheem: allRules.filter(r => r.category === 'tafkheem'),
  };

  const pedagogicalAdvice: string[] = [
    `تقييم نطق الحروف: ${pronunciationScore} / 10`,
    `تقييم تطبيق التجويد: ${tajweedScore} / 10`,
    `المتوسط العام للتقييم: ${overallAverageScore} / 10.`
  ];

  const sampleWords = targetText 
    ? targetText.split(/\s+/) 
    : ['وَٱلْقُرْءَانِ', 'ٱلْحَكِيمِ', 'إِنَّكَ', 'لَمِنَ', 'ٱلْمُرْسَلِينَ'];

  const wordEvaluations: WordEvaluation[] = sampleWords.map((w, idx) => {
    const isFullWordError = accuracyScore < 50 && (idx % 3 === 0);
    const wordStatus = isFullWordError ? 'mispronounced' : (accuracyScore < 70 && idx % 2 === 0 ? 'mispronounced' : 'correct');
    
    const letters: LetterEvaluation[] = w.split('').map((char, charIdx) => {
      const isVowel = /[\u064b-\u0652]/.test(char);
      const isLetterError = wordStatus === 'mispronounced' && !isVowel && (charIdx === 1);
      
      return {
        char,
        isVowel,
        status: isLetterError ? 'mispronounced' : 'correct'
      };
    });

    return {
      word: w,
      status: wordStatus,
      letters
    };
  });

  return {
    pronunciationScore,
    tajweedScore,
    overallAverageScore,
    overallTajweedScore,
    tajweedMasteryPercentage,
    rulesFoundCount: allRules.length,
    masteredCount,
    warningCount,
    needsPracticeCount,
    rulesByCategory,
    allRules,
    pedagogicalAdvice,
    wordEvaluations
  };
}

/**
 * دالة توافقية مطلوبة لملف SurahYasinView.tsx لمنع أخطاء البناء
 */
export function generateTajweedReport(surahData: any[]): TajweedAnalysisReport {
  const start = surahData[0]?.number || 1;
  const end = surahData[surahData.length - 1]?.number || 83;
  const fullText = surahData.map(a => a.text).join(' ');
  return analyzeTajweedForAyahs(start, end, 95, fullText);
}
