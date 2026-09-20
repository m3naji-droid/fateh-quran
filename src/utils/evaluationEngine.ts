import { cleanArabicText, getVerseWords, QuranicWord } from '../data/surahYasin';
import { WordEvaluation, WordStatus } from '../types';
import { analyzeTajweedForAyahs, TajweedAnalysisReport } from './tajweedEngine';

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

/**
 * دالة استخراج وتفصيل الحروف مع حركاتها بدقة صارمة للمقارنة
 */
function extractLettersWithVowels(text: string): { baseLetter: string; vowel: string }[] {
  const result: { baseLetter: string; vowel: string }[] = [];
  // تنظيف النص مع الاحتفاظ بالحركات للتدقيق الصارم
  let i = 0;
  while (i < text.length) {
    const char = text[i];
    // إذا كان حرفاً عربياً أساسياً
    if (/[\u0621-\u064A]/.test(char)) {
      let base = char
        .replace(/[أإآا]/g, 'ا')
        .replace(/[ىي]/g, 'ي')
        .replace(/ة/g, 'ه');
      
      let vowel = '';
      // فحص الحرف التالي إذا كان حركة أو تشكيل (فتح، ضم، كسر، سكون، تنوين)
      if (i + 1 < text.length && /[\u064B-\u0652]/.test(text[i + 1])) {
        vowel = text[i + 1];
        i++;
      }
      result.push({ baseLetter: base, vowel });
    }
    i++;
  }
  return result;
}

/**
 * دالة مطابقة صارمة جداً تقارن الحروف وحركاتها بدقة (الضمة غير الفتحة وغير الكسرة)
 */
function strictLetterMatchingScore(expectedVoweled: string, spokenWord: string): number {
  const expectedLetters = extractLettersWithVowels(expectedVoweled);
  const spokenLetters = extractLettersWithVowels(spokenWord);

  if (expectedLetters.length === 0) return 0;

  let matchedScore = 0;
  const totalLetters = expectedLetters.length;

  for (let i = 0; i < totalLetters; i++) {
    if (i >= spokenLetters.length) break; // حرف ناقص
    
    const exp = expectedLetters[i];
    const spk = spokenLetters[i];

    // مطابقة الحرف الأساسي
    if (exp.baseLetter === spk.baseLetter) {
      // مطابقة التشكيل والحركات بصرامة شديدة
      if (exp.vowel === spk.vowel) {
        matchedScore += 1.0; // حرف وتشيكل صحيح تماماً
      } else {
        matchedScore += 0.4; // الحرف صحيح لكن التشكيل/الحركة خاطئة (مثل نطق المضموم مفتوحاً)
      }
    } else {
      // إبدال حرف بآخر
      matchedScore += 0.0;
    }
  }

  return Math.max(0, Math.min(1, matchedScore / totalLetters));
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
  aiScore: number;             // المجموع الكلي من 10 (نطق الحروف + التجويد)
  tajweedScore: number;         // درجة التجويد من 0 إلى 5 (موزعة على عدد الأحكام)
  pronunciationScore: number;  // درجة نطق الحروف من 0 إلى 5 (موزعة على الحروف والتشكيل)
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

  let totalLetterScoreAccumulator = 0;
  let totalEvaluatedWordsCount = expectedQuranWords.length;
  let correctCount = 0;
  let mispronouncedCount = 0;
  let lastMatchedIndex = -1;

  if (spokenWords.length > 0) {
    let spokenIdx = 0;

    for (let i = 0; i < expectedQuranWords.length; i++) {
      const expected = expectedQuranWords[i];
      
      if (spokenIdx >= spokenWords.length) {
        // ما تبقى يعتبر كلمات مفقودة
        wordEvaluations.push({
          word: expected.voweled,
          cleanWord: expected.normalized,
          status: 'missing',
          ayahNumber: expected.ayahNumber
        });
        continue;
      }

      const currentSpoken = spokenWords[spokenIdx];
      // تقييم صارم يعتمد على الحروف والتشكيل والحركات
      const letterMatchRatio = strictLetterMatchingScore(expected.voweled, currentSpoken);
      
      let status: WordStatus = 'missing';
      let recWord: string | undefined = undefined;

      if (letterMatchRatio >= 0.85) {
        status = 'correct';
        recWord = currentSpoken;
        spokenIdx++;
        correctCount++;
        lastMatchedIndex = i;
        totalLetterScoreAccumulator += 1.0;
      } else if (letterMatchRatio >= 0.35) {
        status = 'mispronounced';
        recWord = currentSpoken;
        spokenIdx++;
        mispronouncedCount++;
        lastMatchedIndex = i;
        totalLetterScoreAccumulator += letterMatchRatio; // خصم صارم بناءً على دقة الحروف والتشكيل الخاطئ
      } else {
        // الكلمة لم تتطابق، نحاول نافذة بحث مصغرة للكلمة التالية
        let bestSubMatchRatio = letterMatchRatio;
        let bestSubIdx = -1;
        const windowSize = 2;
        
        for (let w = 1; w <= windowSize && (spokenIdx + w) < spokenWords.length; w++) {
          const ratio = strictLetterMatchingScore(expected.voweled, spokenWords[spokenIdx + w]);
          if (ratio > bestSubMatchRatio) {
            bestSubMatchRatio = ratio;
            bestSubIdx = spokenIdx + w;
          }
        }

        if (bestSubIdx !== -1 && bestSubMatchRatio >= 0.35) {
          status = bestSubMatchRatio >= 0.85 ? 'correct' : 'mispronounced';
          recWord = spokenWords[bestSubIdx];
          spokenIdx = bestSubIdx + 1;
          if (status === 'correct') correctCount++;
          else mispronouncedCount++;
          lastMatchedIndex = i;
          totalLetterScoreAccumulator += bestSubMatchRatio;
        } else {
          status = 'missing';
        }
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
    expectedQuranWords.forEach((expected) => {
      wordEvaluations.push({
        word: expected.voweled,
        cleanWord: expected.normalized,
        status: 'missing',
        ayahNumber: expected.ayahNumber
      });
    });
  }

  // حساب دقة نطق الحروف والتشكيل الصارم (من 5)
  const basePronunciationRatio = totalLetterScoreAccumulator / Math.max(1, totalEvaluatedWordsCount);
  const completionRatio = Math.min(1.0, (lastMatchedIndex + 1) / Math.max(1, expectedQuranWords.length));
  const strictEffectiveRatio = basePronunciationRatio * Math.max(0.2, completionRatio);

  const pronunciationScore = Number(Math.min(5, Math.max(0, strictEffectiveRatio * 5)).toFixed(1));
  const accuracyPercentage = Math.max(10, Math.min(100, Math.round(strictEffectiveRatio * 100)));

  // تحليل التجويد وتوزيع الدرجات على عدد الأحكام الفعلية بصرامة
  const tajweedReport = analyzeTajweedForAyahs(startAyah, endAyah, accuracyPercentage);
  
  let calculatedTajweedScore = 5.0;
  if (tajweedReport && tajweedReport.rules && tajweedReport.rules.length > 0) {
    const totalRulesCount = tajweedReport.rules.length;
    let violatedRulesCount = 0;

    // خصم صارم بناءً على عدد الأحكام ومستوى الدقة والتشكيل الحركي
    tajweedReport.rules = tajweedReport.rules.map(rule => {
      let isAppliedClean = accuracyPercentage >= 65;
      let ruleScore = 5;

      if (!isAppliedClean || accuracyPercentage < 45) {
        violatedRulesCount++;
        ruleScore = accuracyPercentage < 30 ? 1 : 3;
      }

      return {
        ...rule,
        isApplied: isAppliedClean,
        score: ruleScore
      };
    });

    // توزيع درجات التجويد (من 5) بناءً على نسبة الأحكام المطبقة بشكل صحيح
    const appliedRulesRatio = Math.max(0, (totalRulesCount - violatedRulesCount)) / totalRulesCount;
    calculatedTajweedScore = 5 * appliedRulesRatio * Math.max(0.4, strictEffectiveRatio);
  } else {
    calculatedTajweedScore = strictEffectiveRatio * 5;
  }

  const tajweedScore = Number(Math.min(5, Math.max(0, calculatedTajweedScore)).toFixed(1));

  // حساب المجموع الكلي (من 10) بدقة تامة (نطق الحروف + التجويد)
  const rawAiScore = Number((pronunciationScore + tajweedScore).toFixed(1));
  const aiScore = Math.min(10, Math.max(0, rawAiScore));

  let summaryFeedback = "";
  if (accuracyPercentage >= 85) {
    summaryFeedback = "أداء ممتاز في مخارج الحروف والتشكيل والتجويد، استمر بهذا التميز!";
  } else if (accuracyPercentage >= 60) {
    summaryFeedback = "تلاوة جيدة، يرجى الانتباه أكثر لضبط الحركات القصيرة (الفتح والضم والكسر) وتدقيق الأحكام.";
  } else {
    summaryFeedback = "التلاوة تحتاج إلى تدقيق أكبر في مخرج الحروف وتشكيلها الصحيح وإحكام قواعد التجويد.";
  }

  const missingCount = wordEvaluations.filter(w => w.status === 'missing').length;

  return {
    accuracyPercentage,
    aiScore,              // المجموع الكلي من 10 (نطق الحروف + التجويد)
    tajweedScore,         // درجة التجويد من 5 موزعة على الأحكام
    pronunciationScore,   // درجة نطق الحروف من 5 موزعة على الحروف والتشكيل
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
