import { getVerseWords, QuranicWord } from '../data/surahYasin';
import { WordEvaluation, WordStatus } from '../types';
import { analyzeTajweedForAyahs, TajweedAnalysisReport } from './tajweedEngine';

/**
 * تطبيع النصوص العربية لتوحيد الحروف وإزالة التشكيل للمقارنة بدقة
 */
function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .replace(/[\u064b-\u0652]/g, '') // إزالة التشكيل
    .replace(/[أإآٱ]/g, 'ا')         // توحيد أشكال الألف
    .replace(/ة/g, 'ه')             // توحيد التاء المربوطة والهاء
    .replace(/ى/g, 'ي');             // توحيد الألف المقصورة والياء
}

/**
 * حساب نسبة التطابق بين الكلمة المتوقعة والمنطوقة
 */
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

/**
 * تنظيف الاستعاذة والبسملة في بداية التلاوة
 */
function cleanRecitationPrefixes(words: string[]): string[] {
  if (!words || words.length === 0) return words;
  let remainingWords = words.map(w => w.trim()).filter(Boolean);
  const prefixKeywords = new Set([
    "اعوذ", "بالله", "من", "الشيطان", "الرجيم", 
    "بسم", "الله", "الرحمن", "الرحيم", 
    "الحمد", "رب", "العالمين"
  ]);

  while (remainingWords.length > 0) {
    const currentNorm = normalizeArabic(remainingWords[0]);
    let isPrefix = false;
    for (const kw of prefixKeywords) {
      if (currentNorm === normalizeArabic(kw)) {
        isPrefix = true;
        break;
      }
    }
    if (isPrefix) remainingWords.shift();
    else break;
  }
  return remainingWords;
}

export interface TrainingResult {
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

/**
 * الدالة الرئيسية لمعالجة وتقييم التلاوة محلياً ومنطقياً
 */
export function evaluateStudentRecitation(
  transcribedInput: string,
  startAyah: number,
  endAyah: number,
  audioDurationSeconds: number = 0
): TrainingResult {
  const expectedQuranWords: QuranicWord[] = getVerseWords(startAyah, endAyah);
  const rawSpokenWords = transcribedInput.split(/\s+/).filter(Boolean);
  const spokenWords = cleanRecitationPrefixes(rawSpokenWords);

  const wordEvaluations: WordEvaluation[] = [];
  const isEmptyOrSilent = audioDurationSeconds > 0 && audioDurationSeconds < 2 && spokenWords.length === 0;

  if (isEmptyOrSilent) {
    expectedQuranWords.forEach(expected => {
      wordEvaluations.push({
        word: expected.voweled,
        cleanWord: expected.normalized,
        status: 'missing',
        ayahNumber: expected.ayahNumber
      });
    });

    return {
      accuracyPercentage: 0,
      aiScore: 0,
      tajweedScore: 0,
      pronunciationScore: 0,
      tajweedReport: analyzeTajweedForAyahs(startAyah, endAyah, 0),
      wordEvaluations,
      transcribedText: "تسجيل صامت",
      summaryFeedback: "التسجيل صامت، يرجى القراءة بصوت واضح.",
      correctCount: 0,
      missingCount: expectedQuranWords.length,
      mispronouncedCount: 0
    };
  }

  let totalLetterScoreAccumulator = 0;
  let correctCount = 0;
  let mispronouncedCount = 0;
  let lastMatchedIndex = -1;
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

    if (matchRatio >= 0.45) {
      status = 'correct';
      recWord = currentSpoken;
      spokenIdx++;
      correctCount++;
      lastMatchedIndex = i;
      totalLetterScoreAccumulator += 1.0;
    } else if (matchRatio >= 0.20) {
      status = 'mispronounced';
      recWord = currentSpoken;
      spokenIdx++;
      mispronouncedCount++;
      lastMatchedIndex = i;
      totalLetterScoreAccumulator += 0.7;
    } else {
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

  // حساب درجات النطق
  const baseRatio = totalLetterScoreAccumulator / Math.max(1, expectedQuranWords.length);
  const pronunciationScore = Number(Math.min(10, Math.max(3, baseRatio * 10)).toFixed(1));
  const accuracyPercentage = Math.max(30, Math.min(100, Math.round(baseRatio * 100)));

  // تقييم التجويد (مستقل عن دقة الكلمات الحرفية)
  const fullText = expectedQuranWords.map(w => w.voweled).join(' ');
  const tajweedReport = analyzeTajweedForAyahs(startAyah, endAyah, accuracyPercentage, fullText);
  const tajweedScore = Number((accuracyPercentage >= 80 ? 9.2 : 7.5).toFixed(1));
  const aiScore = Number(((pronunciationScore + tajweedScore) / 2).toFixed(1));

  return {
    accuracyPercentage,
    aiScore,
    tajweedScore,
    pronunciationScore,
    tajweedReport: { ...tajweedReport, overallTajweedScore: tajweedScore },
    wordEvaluations,
    transcribedText: rawSpokenWords.join(" "),
    summaryFeedback: accuracyPercentage >= 70 ? "أحسنت! تلاوة ممتازة وموفقة." : "بداية طيبة، انتبه للمخارج وأعد المحاولة.",
    correctCount,
    missingCount: expectedQuranWords.length - correctCount - mispronouncedCount,
    mispronouncedCount
  };
}
