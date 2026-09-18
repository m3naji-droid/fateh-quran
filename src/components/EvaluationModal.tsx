import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, Volume2, ArrowRight, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { WordEvaluation } from '../types';
import { AudioPlayer } from './AudioPlayer';
import { TajweedAnalysisReport } from '../utils/tajweedEngine';
import { TajweedBreakdownCard } from './TajweedBreakdownCard';

interface EvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  aiScore: number;
  accuracyPercentage: number;
  tajweedScore?: number;
  tajweedReport?: TajweedAnalysisReport;
  wordEvaluations: WordEvaluation[];
  summaryFeedback: string;
  audioBase64?: string;
  onGoToHistory?: () => void;
  onConfirmSend: () => Promise<void>; // دالة الحفظ والإرسال الفعلية
}

export const EvaluationModal: React.FC<EvaluationModalProps> = ({
  isOpen,
  onClose,
  aiScore,
  accuracyPercentage,
  tajweedScore,
  tajweedReport,
  wordEvaluations,
  summaryFeedback,
  audioBase64,
  onGoToHistory,
  onConfirmSend,
}) => {
  const [isSending, setIsSending] = useState(false);
  const [isSentConfirmed, setIsSentConfirmed] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsSentConfirmed(false);
      setIsSending(false);
      if (aiScore >= 8) {
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#059669', '#10b981', '#f59e0b', '#d97706', '#34d399']
          });
        } catch {}
      }
    }
  }, [isOpen, aiScore]);

  if (!isOpen) return null;

  const correctWords = wordEvaluations.filter(w => w.status === 'correct').length;
  const mispronouncedWords = wordEvaluations.filter(w => w.status === 'mispronounced').length;
  const missingWords = wordEvaluations.filter(w => w.status === 'missing').length;

  const handleConfirmAndSend = async () => {
    setIsSending(true);
    try {
      // تنفيذ الحفظ والإرسال السحابي الفعلي وتحديث بيانات المعلم
      await onConfirmSend();
      setIsSentConfirmed(true);
      setTimeout(() => {
        onClose();
        if (onGoToHistory) onGoToHistory();
      }, 1200);
    } catch (err) {
      console.error('Failed to send submission:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden my-6">
        <div className="bg-linear-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 left-5 text-white/80 hover:text-white p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 bg-amber-400/20 text-amber-300 rounded-lg border border-amber-400/30">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-amber-200 uppercase tracking-wider">
              نتيجة التقييم الفوري بالذكاء الاصطناعي
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-1">
            تقرير تصحيح التلاوة
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 max-w-lg">
            {summaryFeedback}
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-center">
              <span className="text-[11px] font-bold text-emerald-800 block mb-1">التقييم العام</span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-900 flex items-baseline justify-center gap-0.5 font-mono">
                <span>{aiScore.toFixed(1)}</span>
                <span className="text-xs text-emerald-600 font-normal">/ 10</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-teal-50/80 border border-teal-200 text-center">
              <span className="text-[11px] font-bold text-teal-800 block mb-1">درجة التجويد</span>
              <div className="text-2xl sm:text-3xl font-black text-teal-900 flex items-baseline justify-center gap-0.5 font-mono">
                <span>{tajweedScore !== undefined ? tajweedScore.toFixed(1) : aiScore.toFixed(1)}</span>
                <span className="text-xs text-teal-600 font-normal">/ 10</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-center">
              <span className="text-[11px] font-bold text-amber-800 block mb-1">نسبة الدقة</span>
              <div className="text-2xl sm:text-3xl font-black text-amber-900 font-mono">
                {accuracyPercentage}%
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-center">
              <span className="text-[11px] font-bold text-stone-700 block mb-1">الكلمات الصحيحة</span>
              <div className="text-2xl font-black text-stone-900 font-mono">
                {correctWords}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-red-50/80 border border-red-200 text-center col-span-2 sm:col-span-1">
              <span className="text-[11px] font-bold text-red-800 block mb-1">تنبيهات النطق</span>
              <div className="text-2xl font-black text-red-900 font-mono">
                {mispronouncedWords + missingWords}
              </div>
            </div>
          </div>

          {audioBase64 && (
            <div>
              <div className="flex items-center gap-2 mb-2 text-xs font-bold text-stone-700">
                <Volume2 className="w-4 h-4 text-emerald-700" />
                <span>الاستماع إلى التسجيل الصوتي لتلاوتك:</span>
              </div>
              <AudioPlayer audioSrc={audioBase64} />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-sm font-bold text-stone-900">
                التصحيح القرآني المظلل للآيات:
              </h3>
            </div>

            <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 max-h-64 overflow-y-auto">
              <div className="flex flex-wrap gap-2 leading-loose text-lg sm:text-xl font-quran text-right">
                {wordEvaluations.map((item, idx) => {
                  let badgeColor = "text-emerald-900 bg-emerald-100/80 border-emerald-300";
                  if (item.status === 'mispronounced') {
                    badgeColor = "text-amber-900 bg-amber-100/90 border-amber-400 font-bold underline decoration-amber-400";
                  } else if (item.status === 'missing') {
                    badgeColor = "text-red-900 bg-red-100/90 border-red-300 line-through opacity-80";
                  }

                  return (
                    <span
                      key={idx}
                      className={`px-2 py-0.5 rounded-lg border text-base sm:text-xl transition-all ${badgeColor}`}
                    >
                      {item.word}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {tajweedReport && (
            <TajweedBreakdownCard report={tajweedReport} compact={false} />
          )}

          <div className="space-y-3 pt-2">
            <button
              onClick={handleConfirmAndSend}
              disabled={isSending || isSentConfirmed}
              className={`w-full py-3.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                isSentConfirmed 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-linear-to-r from-emerald-700 via-emerald-800 to-teal-900 hover:from-emerald-800 hover:to-teal-950 text-white'
              }`}
            >
              {isSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>جاري إرسال واعتماد التلاوة لدى المعلم...</span>
                </>
              ) : isSentConfirmed ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-amber-300 animate-bounce" />
                  <span>تم اعتماد وإرسال النتيجة لمعلم الصف بنجاح!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>تأكيد وإرسال التلاوة الرسمية لمعلم الصف</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-3">
              {onGoToHistory && (
                <button
                  onClick={() => {
                    onClose();
                    onGoToHistory();
                  }}
                  className="flex-1 py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>الانتقال إلى سجل تلاواتي</span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </button>
              )}
              <button
                onClick={onClose}
                className="py-2.5 px-6 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
