import React, { useState } from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, HelpCircle, BookOpen, Volume2, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { TajweedAnalysisReport, TajweedCategory } from '../utils/tajweedEngine';

interface TajweedBreakdownCardProps {
  report: TajweedAnalysisReport;
  compact?: boolean;
}

export const TajweedBreakdownCard: React.FC<TajweedBreakdownCardProps> = ({
  report,
  compact = false
}) => {
  const [selectedCategory, setSelectedCategory] = useState<TajweedCategory | 'all'>('all');
  const [isExpanded, setIsExpanded] = useState(!compact);

  const categoriesConfig: { key: TajweedCategory; label: string; icon: string; count: number }[] = [
    { key: 'noon_tanween', label: 'النون الساكنة والتنوين', icon: '✨', count: report.rulesByCategory.noon_tanween.length },
    { key: 'meem_sakina', label: 'الميم الساكنة', icon: '💫', count: report.rulesByCategory.meem_sakina.length },
    { key: 'madd', label: 'أحكام المدود', icon: '〰️', count: report.rulesByCategory.madd.length },
    { key: 'qalqala', label: 'أحكام القلقلة (قطب جد)', icon: '⚡', count: report.rulesByCategory.qalqala.length },
    { key: 'ghunnah', label: 'الغنن والمشددات', icon: '🔔', count: report.rulesByCategory.ghunnah.length },
    { key: 'tafkheem', label: 'التفخيم والترقيق', icon: '🎯', count: report.rulesByCategory.tafkheem.length },
  ];

  const filteredRules = selectedCategory === 'all' 
    ? report.allRules 
    : report.rulesByCategory[selectedCategory] || [];

  return (
    <div className="bg-white rounded-3xl border border-emerald-200/80 shadow-xs overflow-hidden">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white p-4 sm:p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center font-bold text-lg">
            📜
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm sm:text-base text-white">
                فحص وضبط أحكام التجويد المطبقة
              </h3>
              <span className="text-[10px] font-bold bg-amber-400/20 text-amber-200 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                تدقيق تجويدي آلي
              </span>
            </div>
            <p className="text-xs text-emerald-100/80 mt-0.5">
              تحليل أحكام النون والميم الساكنتين، المدود، القلقلة، الغنن والتفخيم
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Tajweed Score */}
          <div className="text-center px-3 py-1.5 rounded-xl bg-white/10 border border-white/20">
            <span className="text-[10px] text-emerald-200 block font-semibold">درجة التجويد</span>
            <span className="text-lg font-black text-amber-300 font-mono">
              {report.overallTajweedScore.toFixed(1)} <span className="text-xs text-emerald-100">/ 10</span>
            </span>
          </div>

          {compact && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title={isExpanded ? 'طي التفاصيل' : 'عرض التفاصيل'}
            >
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="p-5 space-y-5">
          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
              <span className="text-[11px] font-bold text-emerald-800 block">أحكام متقنة</span>
              <span className="text-xl font-extrabold text-emerald-900 font-mono">
                {report.masteredCount}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-center">
              <span className="text-[11px] font-bold text-amber-800 block">تنبيهات ضبط</span>
              <span className="text-xl font-extrabold text-amber-900 font-mono">
                {report.warningCount}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-teal-50 border border-teal-200 text-center">
              <span className="text-[11px] font-bold text-teal-800 block">إجمالي الأحكام</span>
              <span className="text-xl font-extrabold text-teal-900 font-mono">
                {report.rulesFoundCount}
              </span>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              كافة الأحكام ({report.rulesFoundCount})
            </button>
            {categoriesConfig.map((cat) => {
              if (cat.count === 0) return null;
              const isSelected = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-800'
                  }`}>
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Rules List */}
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {filteredRules.length === 0 ? (
              <div className="text-center py-6 bg-stone-50 rounded-2xl border border-stone-200 text-stone-500 text-xs">
                لا توجد أحكام محددة في هذا القسم للآيات المختارة
              </div>
            ) : (
              filteredRules.map((rule) => {
                let statusBadge = (
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    مُتقَن
                  </span>
                );
                if (rule.status === 'warning') {
                  statusBadge = (
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      تنبيه ضبط
                    </span>
                  );
                } else if (rule.status === 'needs_practice') {
                  statusBadge = (
                    <span className="text-[10px] font-bold bg-red-100 text-red-900 px-2 py-0.5 rounded-full border border-red-300 flex items-center gap-1">
                      <HelpCircle className="w-3 h-3" />
                      يحتاج تمرين
                    </span>
                  );
                }

                return (
                  <div
                    key={rule.id}
                    className="p-3.5 rounded-2xl border border-stone-200 bg-stone-50/70 hover:bg-emerald-50/40 transition-colors space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-stone-900">
                          {rule.ruleName}
                        </span>
                        <span className="text-[11px] font-bold font-quran bg-amber-100 text-amber-950 px-2 py-0.5 rounded-lg border border-amber-200">
                          «{rule.word}»
                        </span>
                        <span className="text-[10px] bg-stone-200 text-stone-700 px-2 py-0.5 rounded-full font-bold">
                          الآية ({rule.ayahNumber})
                        </span>
                      </div>
                      <div className="shrink-0">
                        {statusBadge}
                      </div>
                    </div>

                    <p className="text-xs text-stone-600">
                      {rule.description}
                    </p>

                    <div className="p-2.5 rounded-xl bg-white border border-emerald-100 text-[11px] text-emerald-900 flex items-start gap-2 mt-1">
                      <span className="font-bold text-emerald-700 shrink-0">💡 نصيحة التطبيق:</span>
                      <span>{rule.tip}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Teacher Guidance Notes */}
          {report.pedagogicalAdvice.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <Sparkles className="w-4 h-4 text-amber-700" />
                <span>إرشادات وضوابط التجويد الخاصة بآيات هذا الواجب:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-stone-700">
                {report.pedagogicalAdvice.map((advice, i) => (
                  <li key={i}>{advice}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
