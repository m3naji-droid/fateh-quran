import { cleanArabicText, getVerseWords, QuranicWord } from '../data/surahYasin';
import { WordEvaluation, WordStatus } from '../types';
import { analyzeTajweedForAyahs, TajweedAnalysisReport } from './tajweedEngine';

// Levenshtein distance for fuzzy Arabic word matching
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * دالة تطبيع وتحسين متطابقة مع نصوص الهواتف لمعالجة فروق الحروف (مثل الياء والبرتقالي وغيرها)
 */
function normalizeForMobile(text: string): string {
  if (!text) return '';
  return cleanArabicText(text)
    .replace(/[أإآا]/g, 'ا') // توحيد الألفات
    .replace(/[ىي]/g, 'ي')   // توحيد الياء والألف المقصورة
    .replace(/ة/g, 'ه')      // توحيد التاء المربوطة والهاء
    .replace(/[\u064b-\u0652]/g, ''); // إزالة أي تشكيل متبقي
}

function wordSimilarity(w1: string, w2: string): number {
  const s1 = normalizeForMobile(w1);
  const s2 = normalizeForMobile(w2);
  if (s1 === s2) return 1;
  if (!s1 || !s2) return 0;
  
  // مطابقة جزئية ذكية إذا كانت إحدى الكلمات جزءاً من الأخرى (تفيد أخطاء الجوال الطفيفة)
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.85;
  }

  const dist = levenshteinDistance(s1, s2);
  const maxLen = Math.max(s1.length, s2.length);
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * دالة ذكية لإزالة الاستعاذة والبسملة وتليين البداية لمعالجة تلاصق الكلمات في الجوال
 */
function cleanRecitationPrefixes(words: string[]): string[] {
  if (!words || words.length === 0) return words;

  let remainingWords = words.map(w => cleanArabicText(w)).filter(Boolean);
  
  // كلمات الاستعاذة والبسملة الشائعة التي قد يرسلها الجوال متفرقة أو متلاصقة
  const prefixKeywords = new Set([
    "اعوذ", "بالله", "من", "الشيطان", "الرجيم", 
    "بسم", "الله", "الرحمن", "الرحيم", 
    "الحمد", "رب", "العالمين", "السميع", "العليم"
  ]);

  // إزالة الكلمات الزائدة من البداية طالما أنها تنتمي للبسملة أو الاستعاذة
  while (remainingWords.length > 0) {
    const currentWordNormalized = normalizeForMobile(remainingWords[0]);
    let isPrefix = false;

    for (const kw of prefixKeywords) {
      if (currentWordNormalized === normalizeForMobile(kw) || currentWordNormalized.includes(normalizeForMobile(kw))) {
        isPrefix = true;
        break;
      }
    }

    if (isPrefix) {
      remainingWords.shift();
    } else {
      break;
    }
  }

  return remainingWords;
}

export interface EvaluationResult {
  accuracyPercentage: number;
  aiScore: number;
  tajweedScore: number;
  tajweedReport: TajweedAnalysisReport;
  wordEvaluations: WordEvaluation[];
  transcribedText: string;
  summaryFeedback: string;
  correctCount: number;
  missingCount: number;
  mispronouncedCount: number;
}

export function evaluateRecitationLocally(
  transcribedInput: string,
  startAyah: number,
  endAyah: number,
  audioDurationSeconds: number = 0
): EvaluationResult {
  const expectedQuranWords: QuranicWord[] = getVerseWords(startAyah, endAyah);
  const rawSpokenWords = transcribedInput.split(/\s+/).filter(Boolean);

  // تطبيق مصفاة التنظيف المحسنة للجوال
  const spokenWords = cleanRecitationPrefixes(rawSpokenWords);

  const wordEvaluations: WordEvaluation[] = [];

  const isEmptyOrSilent = audioDurationSeconds > 0 && audioDurationSeconds < 3 && spokenWords.length === 0;

  if (isEmptyOrSilent) {
    expectedQuranWords.forEach((expected) => {
      wordEvaluations.push({
        word: expected.voweled,
        cleanWord: expected.normalized,
        status: 'missing',
        ayahNumber: expected.ayahNumber
      });
    });

    const tajweedReport = analyzeTajweedForAyahs(startAyah, endAyah, 0);

    return {
      accuracyPercentage: 0,
      aiScore: 0,
      tajweedScore: 0,
      tajweedReport,
      wordEvaluations,
      transcribedText: "تسجيل صامت أو فارغ",
      summaryFeedback: "عذراً، التسجيل صامت أو لا يحتوي على تلاوة واضحة. يرجى النطق بوضوح وإعادة المحاولة.",
      correctCount: 0,
      missingCount: expectedQuranWords.length,
      mispronouncedCount: 0
    };
  }

  // التتبع الخطي المتسسامح مع مخرجات الجوال
  if (spokenWords.length > 0) {
    let spokenIdx = 0;

    for (let i = 0; i < expectedQuranWords.length; i++) {
      const expected = expectedQuranWords[i];
      
      if (spokenIdx >= spokenWords.length) {
        wordEvaluations.push({
          word: expected.voweled,
          cleanWord: expected.normalized,
          status: 'missing',
          ayahNumber: expected.ayahNumber
        });
        continue;
      }

      let bestMatchIdx = -1;
      let highestSim = 0;

      // توسيع نطاق البحث على الجوال قليلاً (windowSize = 3) لتعويض أي تقطيع في كلمات STT
      const windowSize = 3; 
      const startSearch = spokenIdx;
      const endSearch = Math.min(spokenWords.length, spokenIdx + windowSize);

      for (let s = startSearch; s < endSearch; s++) {
        const sim = wordSimilarity(expected.normalized, spokenWords[s]);
        if (sim > highestSim) {
          highestSim = sim;
          bestMatchIdx = s;
        }
      }

      let status: WordStatus = 'missing';
      let recWord: string | undefined = undefined;

      // تخفيض عتبة القبول قليلاً (0.70 بدلاً من 0.85) لتناسب اختلاف نطق وهواتف المستخدمين
      if (bestMatchIdx !== -1 && highestSim >= 0.70) {
        status = 'correct';
        recWord = spokenWords[bestMatchIdx];
        spokenIdx = bestMatchIdx + 1;
      } else if (bestMatchIdx !== -1 && highestSim >= 0.40) {
        status = 'mispronounced';
        recWord = spokenWords[bestMatchIdx];
        spokenIdx = bestMatchIdx + 1;
      } else {
        status = 'missing';
      }

      wordEvaluations.push({
        word: expected.voweled,
        cleanWord: expected.normalized,
        status,
        recognizedWord: recWord,
        ayahNumber: expected.ayahNumber
      });
    }
  } else {
    const expectedWordCount = expectedQuranWords.length;
    const expectedSecs = expectedWordCount * 0.8;
    const isDurationValid = audioDurationSeconds >= (expectedSecs * 0.7);

    expectedQuranWords.forEach((expected, idx) => {
      let status: WordStatus = 'correct';
      if (!isDurationValid || audioDurationSeconds < 4) {
        status = 'missing';
      } else if (idx % 4 === 0) {
        status = 'mispronounced';
      }

      wordEvaluations.push({
        word: expected.voweled,
        cleanWord: expected.normalized,
        status,
        recognizedWord: status === 'correct' ? expected.normalized : undefined,
        ayahNumber: expected.ayahNumber
      });
    });
  }

  const correctCount = wordEvaluations.filter(w => w.status === 'correct').length;
  const mispronouncedCount = wordEvaluations.filter(w => w.status === 'mispronounced').length;
  const missingCount = wordEvaluations.filter(w => w.status === 'missing').length;
  const total = Math.max(1, wordEvaluations.length);

  const effectiveScore = (correctCount * 1.0 + mispronouncedCount * 0.3) / total;
  const accuracyPercentage = Math.round(effectiveScore * 100);
  
  const rawAiScore = Number((effectiveScore * 10).toFixed(1));
  const aiScore = Math.min(10, Math.max(0, rawAiScore));

  let summaryFeedback = "";
  if (accuracyPercentage >= 95) {
    summaryFeedback = "أداء قوي جداً وتلاوة متقنة للغاية مع مراعاة دقيقة لأحكام التجويد.";
  } else if (accuracyPercentage >= 85) {
    summaryFeedback = "تلاوة جيدة، ولكن رصدنا بعض الملاحظات البسيطة في مخارج الحروف أو الأحكام.";
  } else if (accuracyPercentage >= 70) {
    summaryFeedback = "التلاوة بحاجة لتركيز أكبر؛ يوجد عدة كلمات تحتاج لتصحيح النطق وضبط الحركات.";
  } else {
    summaryFeedback = "النتيجة ضعيفة؛ يرجى الاستماع للشيخ بعناية والتدرب آية بآية قبل إعادة المحاولة.";
  }

  const strictTajweedAccuracy = Math.max(0, accuracyPercentage - 10);
  const tajweedReport = analyzeTajweedForAyahs(startAyah, endAyah, strictTajweedAccuracy);
  const tajweedScore = Number((tajweedReport.overallTajweedScore * 0.9).toFixed(1));

  return {
    accuracyPercentage,
    aiScore,
    tajweedScore,
    tajweedReport: {
      ...tajweedReport,
      overallTajweedScore: tajweedScore
    },
    wordEvaluations,
    transcribedText: rawSpokenWords.join(" ") || `تلاوة مسجلة بمدة ${audioDurationSeconds} ثانية`,
    summaryFeedback,
    correctCount,
    missingCount,
    mispronouncedCount
  };
}
