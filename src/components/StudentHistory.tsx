import React, { useState } from 'react';
import { Award, Calendar, CheckCircle2, Clock, Sparkles, TrendingUp, Volume2, Eye } from 'lucide-react';
import { Submission } from '../types';
import { AudioPlayer } from './AudioPlayer';
import { EvaluationModal } from './EvaluationModal';

interface StudentHistoryProps {
  submissions: Submission[];
}

export const StudentHistory: React.FC<StudentHistoryProps> = ({ submissions }) => {
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  if (submissions.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-10 text-center border border-stone-200 shadow-xs">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-4 border border-emerald-200">
          <Calendar className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-stone-800 mb-1">لا توجد تسجيلات سابقة بعد</h3>
        <p className="text-xs text-stone-500 max-w-sm mx-auto">
          قم بتسجيل تلاوتك للواجب الأسبوعي الحالي وإرسالها ليتم إضافتها فوراً إلى سجل تلاواتك وتتبع تقدم مستواك.
        </p>
      </div>
    );
  }

  // Calculate statistics
  const totalSubmissions = submissions.length;
  const avgAiScore = (submissions.reduce((acc, curr) => acc + curr.aiScore, 0) / totalSubmissions).toFixed(1);
  const avgAccuracy = Math.round(submissions.reduce((acc, curr) => acc + curr.accuracyPercentage, 0) / totalSubmissions);
  const highestScore = Math.max(...submissions.map(s => s.teacherGrade !== null ? s.teacherGrade : s.aiScore)).toFixed(1);

  // Sort chronological for chart
  const chronologicalSubmissions = [...submissions].sort(
    (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-stone-600">إجمالي التلاوات</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-stone-900 font-mono">
            {totalSubmissions}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-stone-600">متوسط الدقة</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-teal-800 font-mono">
            {avgAccuracy}%
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-stone-600">معدل التقييم الآلي</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-700 font-mono">
            {avgAiScore} <span className="text-xs font-normal text-stone-400">/ 10</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-stone-600">أعلى درجة محققة</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono">
            {highestScore} <span className="text-xs font-normal text-stone-400">/ 10</span>
          </div>
        </div>
      </div>

      {/* Visual Level Progression Chart */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">رسم بياني يوضح تقدم المستوى والدرجات</h3>
              <p className="text-[11px] text-stone-500">متابعة التطور في دقة التلاوة عبر الواجبات المتتالية</p>
            </div>
          </div>
        </div>

        {/* SVG Interactive Progress Chart */}
        <div className="pt-4 pb-2">
          <div className="h-44 flex items-end gap-2 sm:gap-4 border-b border-stone-200 px-2">
            {chronologicalSubmissions.map((sub, index) => {
              const effectiveScore = sub.teacherGrade !== null ? sub.teacherGrade : sub.aiScore;
              const heightPercent = Math.max(15, Math.min(100, (effectiveScore / 10) * 100));

              return (
                <div key={sub.id} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group relative">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-stone-900 text-white text-[10px] py-1 px-2 rounded-md whitespace-nowrap z-20 pointer-events-none shadow-md">
                    {sub.assignmentTitle}: {effectiveScore} / 10 ({sub.accuracyPercentage}%)
                  </div>

                  {/* Bar */}
                  <div className="w-full max-w-[42px] bg-stone-100 rounded-t-xl overflow-hidden h-full flex items-end">
                    <div
                      className={`w-full rounded-t-xl transition-all duration-500 ${
                        effectiveScore >= 9
                          ? 'bg-linear-to-t from-emerald-700 to-emerald-500'
                          : effectiveScore >= 7.5
                          ? 'bg-linear-to-t from-teal-600 to-emerald-400'
                          : 'bg-linear-to-t from-amber-600 to-amber-400'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>

                  {/* Grade label */}
                  <span className="text-[11px] font-bold font-mono text-stone-800">
                    {effectiveScore}
                  </span>

                  {/* Sequence label */}
                  <span className="text-[10px] text-stone-500 font-medium truncate max-w-[50px]">
                    واجب {index + 1}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detailed Submissions History Table / Cards */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-stone-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-stone-900">سجل التلاوات السابقة</h3>
          <span className="text-xs text-stone-500">{submissions.length} تسجيل</span>
        </div>

        <div className="divide-y divide-stone-100">
          {submissions.map((sub) => (
            <div key={sub.id} className="p-5 hover:bg-stone-50/70 transition-colors">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-stone-900">{sub.assignmentTitle}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                      سورة يس
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-stone-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(sub.submittedAt).toLocaleDateString('ar-SA', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <span>•</span>
                    <span>المدة: {sub.durationSeconds} ثانية</span>
                  </div>

                  {/* Teacher Feedback / Notes if provided */}
                  {sub.teacherNotes && (
                    <div className="p-2.5 bg-amber-50/80 rounded-xl border border-amber-200/80 text-xs text-amber-900 mt-2">
                      <span className="font-bold block mb-0.5">ملاحظات وتوجيهات المعلم:</span>
                      <span>{sub.teacherNotes}</span>
                    </div>
                  )}
                </div>

                {/* Right side: Audio Player & Scores */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Audio Player */}
                  <div className="w-full sm:w-auto">
                    <AudioPlayer audioSrc={sub.audioBase64} compact />
                  </div>

                  {/* AI Score Badge */}
                  <div className="text-center bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200">
                    <span className="text-[10px] text-stone-500 block">التقييم العام</span>
                    <span className="text-xs font-black font-mono text-emerald-800">{sub.aiScore} / 10</span>
                  </div>

                  {/* Tajweed Score Badge */}
                  <div className="text-center bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200">
                    <span className="text-[10px] text-teal-700 block font-bold">التجويد</span>
                    <span className="text-xs font-black font-mono text-teal-800">
                      {sub.tajweedScore !== undefined ? sub.tajweedScore : sub.aiScore} / 10
                    </span>
                  </div>

                  {/* Teacher Grade Badge */}
                  <div className={`text-center px-3 py-1.5 rounded-xl border ${
                    sub.teacherGrade !== null
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-stone-50 border-stone-200 text-stone-400'
                  }`}>
                    <span className="text-[10px] block">درجة المعلم</span>
                    <span className="text-xs font-black font-mono">
                      {sub.teacherGrade !== null ? `${sub.teacherGrade} / 10` : 'قيد التدقيق'}
                    </span>
                  </div>

                  {/* View Details Button */}
                  <button
                    onClick={() => setSelectedSubmission(sub)}
                    className="p-2 text-stone-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-xl border border-stone-200 transition-colors cursor-pointer"
                    title="عرض تقرير التصحيح المفصل"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Submission Modal */}
      {selectedSubmission && (
        <EvaluationModal
          isOpen={true}
          onClose={() => setSelectedSubmission(null)}
          aiScore={selectedSubmission.aiScore}
          accuracyPercentage={selectedSubmission.accuracyPercentage}
          tajweedScore={selectedSubmission.tajweedScore}
          tajweedReport={selectedSubmission.tajweedReport}
          wordEvaluations={selectedSubmission.wordEvaluations}
          summaryFeedback={
            selectedSubmission.teacherNotes
              ? `ملاحظة المعلم: ${selectedSubmission.teacherNotes}`
              : `تلاوة الآيات المحددة بدقة ${selectedSubmission.accuracyPercentage}% وتطبيق أحكام التجويد`
          }
          audioBase64={selectedSubmission.audioBase64}
        />
      )}
    </div>
  );
};
