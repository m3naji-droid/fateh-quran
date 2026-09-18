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
 * دالة تطبيع وتحسين متطابقة مع نصوص الهواتف لمعالجة فروق الحروف
 */
function normalizeForMobile(text: string): string {
  if (!text) return '';
  return cleanArabicText(text)
    .replace(/[أإآا]/g, 'ا')
    .replace(/[ىي]/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[\u064b-\u0652]/g, '');
}

function wordSimilarity(w1: string, w2: string): number {
  const s1 = normalizeForMobile(w1);
  const s2 = normalizeForMobile(w2);
  if (s1 === s2) return 1;
  if (!s1 || !s2) return 0;
  
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.85;
  }

  const dist = levenshteinDistance(s1, s2);
  const maxLen = Math.max(s1.length, s2.length);
  return Math.max(0, 1 - dist / maxLen);
}

function cleanRecitationPrefixes(words: string[]): string[] {
  if (!words || words.length === 0) return words;

  let remainingWords = words.map(w => cleanArabicText(w)).filter(Boolean);
  
  const prefixKeywords = new Set([
    "اعوذ", "بالله", "من", "الشيطان", "الرجيم", 
    "بسم", "الله", "الرحمن", "الرحيم", 
    "الحمد", "رب", "العالمين", "السميع", "العليم"
  ]);

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
  tajweedScore: number;         // درجة التجويد من 0 إلى 5
  pronunciationScore: number;  // درجة النطق الصحيح من 0 إلى 5
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
      pronunciationScore: 0,
      tajweedReport,
      wordEvaluations,
      transcribedText: "تسجيل صامت أو فارغ",
      summaryFeedback: "عذراً، التسجيل صامت أو لا يحتوي على تلاوة واضحة. يرجى النطق بوضوح وإعادة المحاولة.",
      correctCount: 0,
      missingCount: expectedQuranWords.length,
      mispronouncedCount: 0
    };
  }

  let correctCount = 0;
  let mispronouncedCount = 0;
  let lastMatchedIndex = -1; // لتتبع إلى أي مدى وصل الطالب في القراءة

  if (spokenWords.length > 0) {
    let spokenIdx = 0;

    for (let i = 0; i < expectedQuranWords.length; i++) {
      const expected = expectedQuranWords[i];
      
      // إذا نفذت كلمات الطالب وتوقف عن التسجيل مبكراً (مثلاً قرأ 4 آيات من 12)
      if (spokenIdx >= spokenWords.length) {
        break;
      }

      let bestMatchIdx = -1;
      let highestSim = 0;
      const windowSize = 3; 
      const startSearch = spokenIdx;
      const endSearch = Math.min(spokenWords.length, spokenIdx + windowSize);

.      for (let s = startSearch; s < endSearch; s++) {
        const sim = wordSimilarity(expected.normalized, spokenWords[s]);
        if (sim > highestSim) {
          highestSim = sim;
          bestMatchIdx = s;
        }
      }

      let status: WordStatus = 'missing';
      let recWord: string | undefined = undefined;

      if (bestMatchIdx !== -1 && highestSim >= 0.70) {
        status = 'correct';
        recWord = spokenWords[bestMatchIdx];
        spokenIdx = bestMatchIdx + 1;
        correctCount++;
        lastMatchedIndex = i;
      } else if (bestMatchIdx !== -1 && highestSim >= 0.40) {
        status = 'mispronounced';
        recWord = spokenWords[bestMatchIdx];
        spokenIdx = bestMatchIdx + 1;
        mispronouncedCount++;
        lastMatchedIndex = i;
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

    // إكمال باقي كلمات الآيات التي لم يقرأها الطالب كـ missing ولكن دون تدمير درجته الإجمالية
    for (let i = wordEvaluations.length; i < expectedQuranWords.length; i++) {
      const expected = expectedQuranWords[i];
      wordEvaluations.push({
        word: expected.voweled,
        cleanWord: expected.normalized,
        status: 'missing',
        ayahNumber: expected.ayahNumber
      });
    }

  } else {
    expectedQuranWords.forEach((expected) => {
      wordEvaluations.push({
        word: expected.voweled,
        cleanWord: expected.normalized,
        status: 'missing',
        ayahNumber: expected.ayahNumber
      });
    });
  }

  // عدد الكلمات التي حاول الطالب قراءتها فعلياً
  const attemptedWordsCount = Math.max(1, lastMatchedIndex + 1);
  
  // حساب دقة الأداء على الجزء المقروء فقط لإنصاف الطالب
  const recitedEffectiveScore = (correctCount * 1.0 + mispronouncedCount * 0.4) / attemptedWordsCount;
  
  // نسبة إنجاز الواجب (كمية الآيات التي غطاها مقارنة بالمطلوب كاملاً)
  const completionRatio = Math.min(1.0, attemptedWordsCount / expectedQuranWords.length);
  
  // الدمج العادل: دقة الأداء مضروبة في نسبة الإنجاز لضمان حصوله على درجته التناسبية الصحيحة (مثلاً 2 إلى 3 من 10 عند إنجاز ثلث المقطع)
  const finalBalancedScore = recitedEffectiveScore * Math.max(0.3, completionRatio);

  const accuracyPercentage = Math.max(15, Math.min(100, Math.round(finalBalancedScore * 100)));
  const rawAiScore = Number((finalBalancedScore * 10).toFixed(1));
  const aiScore = Math.min(10, Math.max(0, rawAiScore));

  const missingCount = wordEvaluations.filter(w => w.status === 'missing').length;

  // درجة النطق الصحيح (من 0 إلى 5) مبنية على دقة الكلمات المقروءة فعلياً
  const pronunciationScore = Number(Math.min(5, Math.max(0, recitedEffectiveScore * 5)).toFixed(1));

  let summaryFeedback = "";
  if (accuracyPercentage >= 85) {
    summaryFeedback = "أداء ممتاز في الآيات التي تلوتها، استمر لإكمال باقي المقطع.";
  } else if (accuracyPercentage >= 60) {
    summaryFeedback = "تلاوة جيدة للأجزاء المقروءة، نأمل إكمال الواجب كاملاً في المرة القادمة.";
  } else {
    summaryFeedback = "التلاوة غير مكتملة أو تحتاج لتركيز أكبر في النطق.";
  }

  // تحليل التجويد مع منحه التقييم السهل والمتسامح
  const tajweedReport = analyzeTajweedForAyahs(startAyah, endAyah, accuracyPercentage);
  
  // درجة التجويد (من 0 إلى 5) تتناسب مع جودة الآيات المقروءة
  let calculatedTajweedScore = recitedEffectiveScore * 5;
  if (calculatedTajweedScore < 2.0 && accuracyPercentage >= 40) {
    calculatedTajweedScore = 2.5; // حد أدنى منصف للمقاطع الجزئية
  }
  const tajweedScore = Number(Math.min(5, Math.max(0, calculatedTajweedScore)).toFixed(1));

  if (tajweedReport && tajweedReport.rules) {
    tajweedReport.rules = tajweedReport.rules.map(rule => ({
      ...rule,
      isApplied: accuracyPercentage >= 30 ? true : rule.isApplied,
      score: accuracyPercentage >= 30 ? 5 : 3
    }));
  }

  return {
    accuracyPercentage,
    aiScore,
    tajweedScore,
    pronunciationScore,
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
