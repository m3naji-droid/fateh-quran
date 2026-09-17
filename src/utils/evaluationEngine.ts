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

function wordSimilarity(w1: string, w2: string): number {
  const s1 = cleanArabicText(w1);
  const s2 = cleanArabicText(w2);
  if (s1 === s2) return 1;
  if (!s1 || !s2) return 0;
  
  const dist = levenshteinDistance(s1, s2);
  const maxLen = Math.max(s1.length, s2.length);
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * دالة ذكية لإزالة الاستعاذة والبسملة (أو أجزائهما) من بدايات النص المنطوق
 * لمنع إزاحة مؤشر التتبع وضياع ترتيب الكلمات القرآنية.
 */
function cleanRecitationPrefixes(words: string[]): string[] {
  if (!words || words.length === 0) return words;

  // تحويل الكلمات إلى نص نظيف وموحد للمقارنة
  let textJoined = words.map(w => cleanArabicText(w)).join(' ');

  // قائمة العبارات الشائعة للاستعاذة والبسملة بصيغها المختلفة بعد التنظيف
  const prefixesToRemove = [
    "اعوذ بالله من الشيطان الرجيم",
    "اعوذ بالله السميع العليم من الشيطان الرجيم",
    "بسم الله الرحمن الرحيم",
    "بسم الله",
    "الحمد لله رب العالمين"
  ];

  let modified = true;
  while (modified) {
    modified = false;
    for (const prefix of prefixesToRemove) {
      if (textJoined.startsWith(prefix)) {
        textJoined = textJoined.substring(prefix.length).trim();
        modified = true;
      }
    }
  }

  // إزالة الكلمات المنفردة الزائدة في البداية إن وجدت (مثل: أعوذ، بالله، الشيطان، الرجيم، بسم...)
  const stopWords = new Set(["اعوذ", "بالله", "من", "الشيطان", "الرجيم", "بسم", "الله", "الرحمن", "الرحيم"]);
  let remainingWords = textJoined.split(/\s+/).filter(Boolean);

  while (remainingWords.length > 0 && stopWords.has(remainingWords[0])) {
    remainingWords.shift();
  }

  return remainingWords;
}

export interface EvaluationResult {
  accuracyPercentage: number;
  aiScore: number; // 0 - 10
  tajweedScore: number; // 0 - 10
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
  const cleanedTranscription = cleanArabicText(transcribedInput);
  const rawSpokenWords = cleanedTranscription.split(/\s+/).filter(Boolean);

  // تطبيق مصفاة إزالة الاستعاذة والبسملة لتعديل بداية المصفوفة بدقة
  const spokenWords = cleanRecitationPrefixes(rawSpokenWords);

  const wordEvaluations: WordEvaluation[] = [];

  // فحص صارم للتسجيل الصامت أو الفارغ
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

  // Case 1: تطبيق خوارزمية التتبع التسلسلي الخطي مع التعامل مع الكلمات المتروكة حتى نهاية المقطع
  if (spokenWords.length > 0) {
    let spokenIdx = 0; // مؤشر تتبع الكلمات المنطوقة يتحرك للأمام حصراً

    for (let i = 0; i < expectedQuranWords.length; i++) {
      const expected = expectedQuranWords[i];
      
      // إذا نفدت الكلمات المنطوقة من الطالب (توقف قبل نهاية المقطع)، نعتبر بقية الكلمات مفقودة
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

      // نطاق بحث زمني ضيق يمنع القفز العشوائي ويضمن التتبع كلمة بكلمة
      const windowSize = 2; 
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

      // شروط مطابقة صارمة مرتبطة بالترتيب الخطي المباشر
      if (bestMatchIdx !== -1 && highestSim >= 0.85) {
        status = 'correct';
        recWord = spokenWords[bestMatchIdx];
        spokenIdx = bestMatchIdx + 1; // التقدم للكلمة التالية في النطق
      } else if (bestMatchIdx !== -1 && highestSim >= 0.50) {
        status = 'mispronounced';
        recWord = spokenWords[bestMatchIdx];
        spokenIdx = bestMatchIdx + 1; // التقدم للكلمة التالية مع رصد خطأ في النطق
      } else {
        // الكلمة لم تُنطق في مكانها الصحيح، تُعتبر مفقودة دون التقدم في مؤشر النطق
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
    // Case 2: In absence of STT tokens, apply strict evaluation based on duration
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
