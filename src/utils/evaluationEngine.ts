import { getVerseWords, QuranicWord } from '../data/surahYasin';
import { WordEvaluation, WordStatus } from '../types';
import { analyzeTajweedForAyahs, TajweedAnalysisReport } from './tajweedEngine';

/**
 * تطبيع عميق وشامل لتوحيد الحروف وإزالة التشكيل للمقارنة مع النصوص المنطوقة (STT)
 */
function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .replace(/[\u064b-\u0652]/g, '') // إزالة التشكيل
    .replace(/[أإآٱ]/g, 'ا')        // توحيد أشكال الألف
    .replace(/ة/g, 'ه')            // توحيد التاء المربوطة والهاء
    .replace(/ى/g, 'ي');           // توحيد الألف المقصورة والياء
}

/**
 * حساب نسبة التطابق بين الكلمة المتوقعة والكلمة المنطوقة بناءً على الحروف الأساسية
 */
function calculateWordMatchRatio(expectedVoweled: string, spokenWord: string): number {
  const normExpected = normalizeArabic(expectedVoweled);
  const normSpoken = normalizeArabic(spokenWord);

  if (!normExpected || !normSpoken) return 0;

  // تطابق تام للنص المطبع
  if (normExpected === normSpoken) return 1.0;

  // مطابقة جزئية باستخدام خوارزمية بسيطة لتشابه الحروف
  let matches = 0;
  const maxLen = Math.max(normExpected.length, normSpoken.length);
  
  for (let i = 0; i < Math.min(normExpected.length, normSpoken.length); i++) {
    if (normExpected[i] === normSpoken[i]) {
      matches++;
    }
  }

  return matches / maxLen;
}

/**
 * تنظيف الكلمات الاستعشادية أو البسملة في بداية التسجيل
 */
function cleanRecitationPrefixes(words: string[]): string[] {
  if (!words || words.length === 0) return words;

  let remainingWords = words.map(w => w.trim()).filter(Boolean);
  const prefixKeywords = new Set([
    "اعوذ", "بالله", "من", "الشيطان", "الرجيم", 
    "بسم", "الله", "الرحمن", "الرحيم", 
    "الحمد", "رب", "العالمين", "السميع", "العليم"
  ]);

  while (remainingWords.length > 0) {
    const currentWordNormalized = normalizeArabic(remainingWords[0]);
    let isPrefix = false;

    for (const kw of prefixKeywords) {
      if (currentWordNormalized === normalizeArabic(kw)) {
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
  pronunciationScore: number;   
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
  const isEmptyOrSilent = audioDurationSeconds > 0 && audioDurationSeconds < 2 && spokenWords.length === 0;

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
        wordEvaluations.push({
          word: expected.voweled,
          cleanWord: expected.normalized,
          status: 'missing',
          ayahNumber: expected.ayahNumber
        });
        continue;
      }

      const currentSpoken = spokenWords[spokenIdx];
      const matchRatio = calculateWordMatchRatio(expected.voweled, currentSpoken);
      
      let status: WordStatus = 'missing';
      let recWord: string | undefined = undefined;

      if (matchRatio >= 0.65) {
        status = 'correct';
        recWord = currentSpoken;
        spokenIdx++;
        correctCount++;
        lastMatchedIndex = i;
        totalLetterScoreAccumulator += 1.0;
      } else if (matchRatio >= 0.30) {
        status = 'mispronounced';
        recWord = currentSpoken;
        spokenIdx++;
        mispronouncedCount++;
        lastMatchedIndex = i;
        totalLetterScoreAccumulator += matchRatio; 
      } else {
        // فحص النافذة البديلة (Window Search) لتجاوز التقديم أو التأخير البسيط
        let bestSubMatchRatio = matchRatio;
        let bestSubIdx = -1;
        const windowSize = 2;
        
        for (let w = 1; w <= windowSize && (spokenIdx + w) < spokenWords.length; w++) {
          const ratio = calculateWordMatchRatio(expected.voweled, spokenWords[spokenIdx + w]);
          if (ratio > bestSubMatchRatio) {
            bestSubMatchRatio = ratio;
            bestSubIdx = spokenIdx + w;
          }
        }

        if (bestSubIdx !== -1 && bestSubMatchRatio >= 0.30) {
          status = bestSubMatchRatio >= 0.65 ? 'correct' : 'mispronounced';
          recWord = spokenWords[bestSubIdx];
          spokenIdx = bestSubIdx + 1;
          if (status === 'correct') correctCount++;
          else mispronouncedCount++;
          lastMatchedIndex = i;
          totalLetterScoreAccumulator += bestSubMatchRatio;
        } else {
          status = 'missing';
          // تحريك المؤشر بحذر لمنع تجمد الحلقة في حال كانت الكلمة خاطئة تماماً
          spokenIdx++; 
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

  const basePronunciationRatio = totalLetterScoreAccumulator / Math.max(1, totalEvaluatedWordsCount);
  const completionRatio = Math.min(1.0, (lastMatchedIndex + 1) / Math.max(1, expectedQuranWords.length));
  const effectiveRatio = Math.min(1.0, basePronunciationRatio * Math.max(0.4, completionRatio));

  const pronunciationScore = Number(Math.min(10, Math.max(1, effectiveRatio * 10)).toFixed(1));
  const accuracyPercentage = Math.max(15, Math.min(100, Math.round(effectiveRatio * 100)));

  const tajweedReport = analyzeTajweedForAyahs(startAyah, endAyah, accuracyPercentage);
  
  let calculatedTajweedScore = 10.0;
  const rulesList = tajweedReport.allRules || [];
  
  if (tajweedReport && rulesList.length > 0) {
    const totalRulesCount = rulesList.length;
    let successfulRulesCount = 0;

    rulesList.forEach(() => {
      const isAppliedClean = accuracyPercentage >= 40; 
      if (isAppliedClean) successfulRulesCount++;
    });

    const ruleSuccessRatio = successfulRulesCount / totalRulesCount;
    calculatedTajweedScore = Math.min(10, Math.max(4, (ruleSuccessRatio * 6) + (effectiveRatio * 4)));
  } else {
    calculatedTajweedScore = Math.min(10, Math.max(4, effectiveRatio * 10));
  }

  const tajweedScore = Number(calculatedTajweedScore.toFixed(1));
  const rawAiScore = Number(((pronunciationScore + tajweedScore) / 2).toFixed(1));
  const aiScore = Math.min(10, Math.max(2, rawAiScore));

  let summaryFeedback = "";
  if (accuracyPercentage >= 75) {
    summaryFeedback = "أحسنت! تلاوة طيبة ومسترسلة تدل على حفظ وفهم ممتازين.";
  } else if (accuracyPercentage >= 45) {
    summaryFeedback = "بداية موفقة وتلاوة جميلة، استمر في التدريب وستتحسن أكثر.";
  } else {
    summaryFeedback = "محاولة جيدة، حاول القراءة بهدوء وبجانب المصحف لضبط الكلمات.";
  }

  const missingCount = wordEvaluations.filter(w => w.status === 'missing').length;

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
