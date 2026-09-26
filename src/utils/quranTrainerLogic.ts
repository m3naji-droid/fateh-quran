import { getVerseWords, QuranicWord } from '../data/surahYasin';
import { WordEvaluation, WordStatus } from '../types';
import { analyzeTajweedForAyahs, TajweedAnalysisReport } from './tajweedEngine';

function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .replace(/[\u064b-\u0652]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي');
}

function calculateWordMatchRatio(expectedVoweled: string, spokenWord: string): number {
  const normExpected = normalizeArabic(expectedVoweled);
  const normSpoken = normalizeArabic(spokenWord);
  if (!normExpected || !normSpoken) return 0;
  if (normExpected === normSpoken) return 1.0;

  let matches = 0;
  const maxLen = Math.max(normExpected.length, normSpoken.length);
  for (let i = 0; i < Math.min(normExpected.length, normSpoken.length); i++) {
    if (normExpected[i] === normSpoken[i]) matches++;
  }
  return matches / maxLen;
}

export function evaluateStudentRecitationDynamic(
  transcribedInput: string,
  startAyah: number,
  endAyah: number
): any {
  // جلب كلمات الآيات المحددة (سواء آية واحدة أو عدة آيات)
  const expectedQuranWords: QuranicWord[] = getVerseWords(startAyah, endAyah);
  const spokenWords = transcribedInput.split(/\s+/).filter(Boolean);

  const wordEvaluations: WordEvaluation[] = [];
  
  if (spokenWords.length === 0 || expectedQuranWords.length === 0) {
    return {
      accuracyPercentage: 0,
      pronunciationScore: 0,
      tajweedScore: 0,
      aiScore: 0,
      wordEvaluations: [],
      summaryFeedback: "الرجاء إدخال أو تسجيل تلاوة صحيحة."
    };
  }

  let correctCount = 0;
  let mispronouncedCount = 0;
  let totalScoreAccumulator = 0;
  let spokenIdx = 0;

  // مطابقة مرنة تدعم النطق بغض النظر عن طول الآيات المحددة
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

    if (matchRatio >= 0.45) {
      status = 'correct';
      recWord = currentSpoken;
      spokenIdx++;
      correctCount++;
      totalScoreAccumulator += 1.0;
    } else if (matchRatio >= 0.20) {
      status = 'mispronounced';
      recWord = currentSpoken;
      spokenIdx++;
      mispronouncedCount++;
      totalScoreAccumulator += 0.7;
    } else {
      // التحقق من تجاوز الكلمة أو خطأ في الترتيب البسيط
      status = 'missing';
      spokenIdx++; 
    }

    wordEvaluations.push({
      word: expected.voweled,
      cleanWord: expected.normalized,
      status,
      recognizedWord: recWord,
      ayahNumber: expected.ayahNumber
    });
  }

  const accuracyRatio = totalScoreAccumulator / Math.max(1, expectedQuranWords.length);
  const accuracyPercentage = Math.max(20, Math.min(100, Math.round(accuracyRatio * 100)));
  const pronunciationScore = Number((accuracyRatio * 10).toFixed(1));
  const tajweedScore = Number((accuracyPercentage >= 80 ? 9.0 : 7.2).toFixed(1));
  const aiScore = Number(((pronunciationScore + tajweedScore) / 2).toFixed(1));

  return {
    accuracyPercentage,
    pronunciationScore,
    tajweedScore,
    aiScore,
    wordEvaluations,
    correctCount,
    missingCount: expectedQuranWords.length - correctCount - mispronouncedCount,
    mispronouncedCount,
    summaryFeedback: accuracyPercentage >= 75 ? "تلاوة رائعة ومتقنة للآيات المحددة!" : "أداء جيد، حاول التركيز على ضبط الكلمات بدقة أكبر."
  };
}
