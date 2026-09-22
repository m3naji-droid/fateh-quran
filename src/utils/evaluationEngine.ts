import { cleanArabicText, getVerseWords, QuranicWord } from '../data/surahYasin';
import { WordEvaluation, WordStatus } from '../types';
import { analyzeTajweedForAyahs, TajweedAnalysisReport } from './tajweedEngine';

/**
 * [معدل] تطبيع نظيف يحافظ على كل حرف ومخرجه دون دمج الحروف ببعضها، مع إزالة التشكيل فقط للمطابقة الأساسية
 */
function normalizePreservingLetters(text: string): string {
  if (!text) return '';
  // إزالة التشكيل فقط وعدم دمج الحروف (نحافظ على الألف والهمزات والياءات كما نطقها الطالب)
  return text.trim().replace(/[\u064b-\u0652]/g, '');
}

/**
 * دالة استخراج وتفصيل الحروف مع حركاتها بدقة تامة لكل حرف على حدة
 */
function extractLettersWithVowels(text: string): { baseLetter: string; vowel: string }[] {
  const result: { baseLetter: string; vowel: string }[] = [];
  let i = 0;
  while (i < text.length) {
    const char = text[i];
    // التحقق من الحروف العربية بدقة دون دمجها
    if (/[\u0621-\u064A]/.test(char)) {
      const base = char; // الاحتفاظ بالحرف كما هو تماماً دون أي استبدال أو دمج
      
      let vowel = '';
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
 * دالة مطابقة دقيقة تقارن كل حرف على حده مع تسامح طفيف في التشكيل فقط
 */
function preciseLetterMatchingScore(expectedVoweled: string, spokenWord: string): number {
  const expectedLetters = extractLettersWithVowels(expectedVoweled);
  const spokenLetters = extractLettersWithVowels(spokenWord);

  if (expectedLetters.length === 0) return 0;

  let matchedScore = 0;
  const totalLetters = expectedLetters.length;

  for (let i = 0; i < totalLetters; i++) {
    if (i >= spokenLetters.length) break;
    
    const exp = expectedLetters[i];
    const spk = spokenLetters[i];

    // اشتراط مطابقة الحرف الأصلي بدقة تامة (لا دمج للحروف)
    if (exp.baseLetter === spk.baseLetter) {
      if (exp.vowel === spk.vowel) {
        matchedScore += 1.0; // تطابق تام للحرف والحركة
      } else {
        matchedScore += 0.8; // تطابق الحرف مع اختلاف بسيط في الحركة
      }
    } else {
      matchedScore += 0.0; // اختلاف الحرف يعني عدم التطابق لهذا الحرف
    }
  }

  const rawRatio = matchedScore / totalLetters;
  return Math.max(0, Math.min(1, rawRatio));
}

function cleanRecitationPrefixes(words: string[]): string[] {
  if (!words || words.length === 0) return words;

  let remainingWords = words.map(w => w.trim()).filter(Boolean);
  
  const prefixKeywords = new Set([
    "اعوذ", "بالله", "من", "الشيطان", "الرجيم", 
    "بسم", "الله", "الرحمن", "الرحيم", 
    "الحمد", "رب", "العالمين", "السميع", "العليم"
  ]);

  while (remainingWords.length > 0) {
    const currentWordNormalized = normalizePreservingLetters(remainingWords[0]);
    let isPrefix = false;

    for (const kw of prefixKeywords) {
      if (currentWordNormalized === normalizePreservingLetters(kw)) {
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
      // فحص الحروف بدقة مستقلة لكل حرف
      const letterMatchRatio = preciseLetterMatchingScore(expected.voweled, currentSpoken);
      
      let status: WordStatus = 'missing';
      let recWord: string | undefined = undefined;

      if (letterMatchRatio >= 0.70) {
        status = 'correct';
        recWord = currentSpoken;
        spokenIdx++;
        correctCount++;
        lastMatchedIndex = i;
        totalLetterScoreAccumulator += 1.0;
      } else if (letterMatchRatio >= 0.25) {
        status = 'mispronounced';
        recWord = currentSpoken;
        spokenIdx++;
        mispronouncedCount++;
        lastMatchedIndex = i;
        totalLetterScoreAccumulator += letterMatchRatio; 
      } else {
        let bestSubMatchRatio = letterMatchRatio;
        let bestSubIdx = -1;
        const windowSize = 2;
        
        for (let w = 1; w <= windowSize && (spokenIdx + w) < spokenWords.length; w++) {
          const ratio = preciseLetterMatchingScore(expected.voweled, spokenWords[spokenIdx + w]);
          if (ratio > bestSubMatchRatio) {
            bestSubMatchRatio = ratio;
            bestSubIdx = spokenIdx + w;
          }
        }

        if (bestSubIdx !== -1 && bestSubMatchRatio >= 0.25) {
          status = bestSubMatchRatio >= 0.70 ? 'correct' : 'mispronounced';
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

  const basePronunciationRatio = totalLetterScoreAccumulator / Math.max(1, totalEvaluatedWordsCount);
  const completionRatio = Math.min(1.0, (lastMatchedIndex + 1) / Math.max(1, expectedQuranWords.length));
  const effectiveRatio = Math.min(1.0, basePronunciationRatio * Math.max(0.4, completionRatio));

  const pronunciationScore = Number(Math.min(10, Math.max(1, effectiveRatio * 10)).toFixed(1));
  const accuracyPercentage = Math.max(15, Math.min(100, Math.round(effectiveRatio * 100)));

  const tajweedReport = analyzeTajweedForAyahs(startAyah, endAyah, accuracyPercentage);
  
  let calculatedTajweedScore = 10.0;
  if (tajweedReport && tajweedReport.rules && tajweedReport.rules.length > 0) {
    const totalRulesCount = tajweedReport.rules.length;
    let successfulRulesCount = 0;

    tajweedReport.rules = tajweedReport.rules.map(rule => {
      const isAppliedClean = accuracyPercentage >= 40; 
      if (isAppliedClean) successfulRulesCount++;

      const ruleScore = isAppliedClean ? Math.min(10, Math.max(7, Math.round(accuracyPercentage / 10))) : 5.0;

      return {
        ...rule,
        isApplied: isAppliedClean,
        score: ruleScore
      };
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
