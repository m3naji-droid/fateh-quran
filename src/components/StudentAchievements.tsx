import React from 'react';
import { Trophy, Sparkles, CheckCircle2, Flame, TrendingUp, Target, Award } from 'lucide-react';
import { Submission } from '../types';

interface StudentAchievementsProps {
  submissions: Submission[];
}

export interface AchievementItem {
  id: string;
  title: string;
  icon: string;
  description: string;
  unlocked: boolean;
  date?: string;
}

export const StudentAchievements: React.FC<StudentAchievementsProps> = ({ submissions }) => {
  // حساب الإنجازات بناءً على البيانات الحقيقية للطالب
  const totalSubmissions = submissions.length;
  const hasFirstSubmission = totalSubmissions > 0;
  
  // هل توجد تلاوة بدرجة 90% أو أكثر
  const hasHighScore = submissions.some(s => s.accuracyPercentage >= 90 || s.aiScore >= 9);

  // حساب الاستمرارية والتسلسل البسيط
  const hasStreak3 = totalSubmissions >= 3;
  const hasStreak7 = totalSubmissions >= 7;

  // التحقق من تحسن الدرجة بنسبة 10% بين تلاوتتين متتاليتين
  let hasImproved10Percent = false;
  let totalErrorsFixed = 0;

  const sortedSubs = [...submissions].sort(
    (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
  );

  for (let i = 1; i < sortedSubs.length; i++) {
    const prev = sortedSubs[i - 1].aiScore;
    const curr = sortedSubs[i].aiScore;
    if (curr - prev >= 1.0) { // تحسن بناموس الدرجات (1 من 10 يعادل 10%)
      hasImproved10Percent = true;
    }
  }

  // حساب الأخطاء المصححة من تقييم الكلمات
  sortedSubs.forEach(sub => {
    if (sub.wordEvaluations) {
      const fixedInSub = sub.wordEvaluations.filter(w => w.status === 'correct').length;
      totalErrorsFixed += fixedInSub;
    }
  });

  const hasFixed10Errors = totalErrorsFixed >= 10;
  const isAdvancedLevel = totalSubmissions >= 10 || Number(totalSubmissions && (sortedSubs.reduce((acc, s) => acc + s.aiScore, 0) / totalSubmissions)) >= 8.5;

  const achievementsList: AchievementItem[] = [
    {
      id: 'first_recitation',
      title: 'أول تلاوة',
      icon: '🎙️',
      description: 'أتممت تسجيل وأرسلت تلاوتك الأولى بنجاح.',
      unlocked: hasFirstSubmission,
    },
    {
      id: 'first_complete',
      title: 'أول محاولة مكتملة',
      icon: '📖',
      description: 'إتمام جلسة استماع وتسجيل متكاملة للآيات.',
      unlocked: hasFirstSubmission,
    },
    {
      id: 'streak_3',
      title: '3 محاولات متتالية',
      icon: '🔥',
      description: 'قمت بإرسال 3 تلاوات ومتابعة مستمرة.',
      unlocked: hasStreak3,
    },
    {
      id: 'streak_7',
      title: '7 محاولات / أيام تدريب',
      icon: '🔥',
      description: 'وصلت إلى 7 تلاوات مسجلة في سجل إنجازك.',
      unlocked: hasStreak7,
    },
    {
      id: 'high_score',
      title: 'درجة 90% أو أكثر',
      icon: '⭐',
      description: 'حققت تقييماً ممتازاً يتجاوز 90% في إحدى التلاوات.',
      unlocked: hasHighScore,
    },
    {
      id: 'improved_10',
      title: 'تحسن بنسبة 10%',
      icon: '📈',
      description: 'طورت مستواك ورفعتم درجاتك مقارنة بتلاواتك السابقة.',
      unlocked: hasImproved10Percent,
    },
    {
      id: 'fixed_10_errors',
      title: 'تصحيح 10 أخطاء',
      icon: '🎯',
      description: 'تجاوزت 10 كلمات ومخارج حروف بنجاح في تلاواتك.',
      unlocked: hasFixed10Errors,
    },
    {
      id: 'advanced_level',
      title: 'الوصول إلى مستوى متقدم',
      icon: '🏆',
      description: 'أظهرت استقراراً وثباتاً عالياً في جودة التلاوة والتجويد.',
      unlocked: isAdvancedLevel,
    },
  ];

  const unlockedCount = achievementsList.filter(a => a.unlocked).length;

  return (
    <div className="space-y-6">
      {/* رأس القسم */}
      <div className="bg-linear-to-r from-emerald-900 to-teal-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-right">
          <div className="inline-flex items-center gap-2 bg-amber-400/20 text-amber-300 px-3 py-1 rounded-full text-xs font-bold border border-amber-400/30 mb-2">
            <Trophy className="w-3.5 h-3.5" />
            <span>لوحة تحفيزية هادئة</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black">إنجازاتي 🏆</h2>
          <p className="text-xs text-emerald-100/80">
            تتبع مسيرتك المباركة في حفظ وتلاوة سورة يس بناءً على نشاطك الفعلي.
          </p>
        </div>
        <div className="bg-white/10 border border-white/20 rounded-2xl p-4 text-center shrink-0 min-w-[120px]">
          <span className="text-[10px] text-emerald-200 block font-bold">الإنجازات المكتسبة</span>
          <span className="text-2xl font-black font-mono text-amber-300">
            {unlockedCount} / {achievementsList.length}
          </span>
        </div>
      </div>

      {/* شبكة الإنجازات */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {achievementsList.map((item) => (
          <div
            key={item.id}
            className={`rounded-3xl p-5 border transition-all flex flex-col justify-between relative overflow-hidden ${
              item.unlocked
                ? 'bg-white border-emerald-200 shadow-xs'
                : 'bg-stone-50/70 border-stone-200 opacity-60'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl sm:text-3xl p-2.5 bg-stone-100 rounded-2xl shadow-inner inline-block">
                  {item.icon}
                </span>
                {item.unlocked ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    مُحقق
                  </span>
                ) : (
                  <span className="text-[10px] font-bold bg-stone-200 text-stone-600 px-2.5 py-1 rounded-full">
                    قيد التقدم
                  </span>
                )}
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-stone-900 mb-1">
                {item.title}
              </h3>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
