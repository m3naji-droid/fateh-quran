import React, { useState } from 'react';
import { BookOpen, Sparkles, Award, ArrowRight, CheckCircle2, History, Info, Volume2, Headphones, Mic } from 'lucide-react';
import { Assignment, ClassRoom, Student, Submission } from '../types';
import { getVerseRangeText } from '../data/surahYasin';
import { AudioRecorder } from './AudioRecorder';
import { EvaluationModal } from './EvaluationModal';
import { StudentHistory } from './StudentHistory';
import { SurahYasinView } from './SurahYasinView';
import { InteractiveTrainingMode } from './InteractiveTrainingMode';
import { evaluateRecitationLocally, EvaluationResult } from '../utils/evaluationEngine';
import { saveSubmission } from '../utils/storage';
import { AudioPlayer } from './AudioPlayer';
import { MisharyAyahPlayer } from './MisharyAyahPlayer';

interface StudentInterfaceProps {
  student: Student;
  classRoom: ClassRoom;
  assignments: Assignment[];
  submissions: Submission[];
  onSubmissionsUpdated: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const StudentInterface: React.FC<StudentInterfaceProps> = ({
  student,
  classRoom,
  assignments,
  submissions,
  onSubmissionsUpdated,
  activeTab,
  setActiveTab,
}) => {
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>(
    assignments[0]?.id || ''
  );
  const [activeAyahListening, setActiveAyahListening] = useState<number | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [currentEvaluation, setCurrentEvaluation] = useState<EvaluationResult | null>(null);
  const [submittedAudioBase64, setSubmittedAudioBase64] = useState<string>('');
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);

  // Filter assignments for student's class or assignments for all classes ('all')
  const classAssignments = assignments.filter((a) => a.classId === student.classId || a.classId === 'all');
  const currentAssignment = classAssignments.find((a) => a.id === selectedAssignmentId) || classAssignments[0];

  // Check if student already submitted this assignment
  const mySubmissions = submissions.filter((s) => s.studentId === student.id);
  const existingSubmission = currentAssignment 
    ? mySubmissions.find((s) => s.assignmentId === currentAssignment.id)
    : null;

  // Ayahs for current assignment
  const currentAyahs = currentAssignment
    ? getVerseRangeText(currentAssignment.startAyah, currentAssignment.endAyah)
    : [];

  const handleRecitationCompleted = async (
    audioBase64: string,
    durationSeconds: number,
    transcribedText: string
  ) => {
    if (!currentAssignment) return;

    setIsEvaluating(true);
    setSubmittedAudioBase64(audioBase64);

    try {
      // Small natural delay so user sees AI processing
      await new Promise((res) => setTimeout(res, 800));

      // Local AI evaluation engine
      const evalResult = evaluateRecitationLocally(
        transcribedText,
        currentAssignment.startAyah,
        currentAssignment.endAyah,
        durationSeconds
      );

      // Save submission to persistent storage
      await saveSubmission({
        studentId: student.id,
        studentName: student.name,
        personalNumber: student.personalNumber,
        classId: student.classId,
        className: classRoom.name,
        assignmentId: currentAssignment.id,
        assignmentTitle: currentAssignment.title,
        audioBase64,
        durationSeconds,
        transcribedText: evalResult.transcribedText,
        accuracyPercentage: evalResult.accuracyPercentage,
        aiScore: evalResult.aiScore,
        tajweedScore: evalResult.tajweedScore,
        tajweedReport: evalResult.tajweedReport,
        teacherGrade: null,
        teacherNotes: '',
        wordEvaluations: evalResult.wordEvaluations,
      });

      setCurrentEvaluation(evalResult);
      setShowEvaluationModal(true);
      onSubmissionsUpdated();
    } catch (err) {
      console.error('Submission evaluation error:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mobile Tab Switcher */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:hidden bg-stone-100 p-1 rounded-2xl border border-stone-200 gap-1">
        <button
          onClick={() => setActiveTab('current-assignment')}
          className={`py-2 px-1 text-center text-[11px] font-bold rounded-xl transition-all ${
            activeTab === 'current-assignment'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-stone-600'
          }`}
        >
          الواجب والتسجيل
        </button>
        <button
          onClick={() => setActiveTab('training')}
          className={`py-2 px-1 text-center text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1 ${
            activeTab === 'training'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-amber-800 bg-amber-100/70 font-black'
          }`}
        >
          <Headphones className="w-3 h-3" />
          <span>اسمع وردّد</span>
        </button>
        <button
          onClick={() => setActiveTab('my-history')}
          className={`py-2 px-1 text-center text-[11px] font-bold rounded-xl transition-all ${
            activeTab === 'my-history'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-stone-600'
          }`}
        >
          سجل تلاواتي ({mySubmissions.length})
        </button>
        <button
          onClick={() => setActiveTab('full-surah')}
          className={`py-2 px-1 text-center text-[11px] font-bold rounded-xl transition-all ${
            activeTab === 'full-surah'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-stone-600'
          }`}
        >
          سورة يس
        </button>
      </div>

      {/* VIEW 1: CURRENT ASSIGNMENT & RECORDER */}
      {activeTab === 'current-assignment' && (
        <div className="space-y-6">
          {/* Assignment Selector & Header Banner */}
          <div className="bg-linear-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="p-1.5 bg-amber-400/20 text-amber-300 rounded-lg border border-amber-400/30">
                    <Award className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-bold text-amber-200">
                    {classRoom.name}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white">
                  {currentAssignment ? currentAssignment.title : 'لا يوجد واجب مسند لهذا الأسبوع بعد'}
                </h1>
                {currentAssignment && (
                  <p className="text-xs sm:text-sm text-emerald-100/90 mt-1">
                    المطلوب تلاوة: سورة يس من الآية ({currentAssignment.startAyah}) إلى الآية ({currentAssignment.endAyah})
                  </p>
                )}
              </div>

              {/* Assignment Switcher if multiple assignments exist */}
              {classAssignments.length > 1 && (
                <div className="bg-white/10 p-2 rounded-2xl border border-white/20">
                  <label className="text-[10px] text-emerald-200 block mb-1 font-bold">
                    اختر الواجب:
                  </label>
                  <select
                    value={selectedAssignmentId}
                    onChange={(e) => setSelectedAssignmentId(e.target.value)}
                    className="bg-emerald-950 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-emerald-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    {classAssignments.map((asg) => (
                      <option key={asg.id} value={asg.id}>
                        {asg.title} (الآيات {asg.startAyah}-{asg.endAyah})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {!currentAssignment ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-stone-200 shadow-xs">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-4 border border-emerald-200">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-stone-800 mb-1">بانتظار إسناد واجب جديد</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                لم يقم المعلم بعد بإسناد واجب أسبوعي لهذا الصف. يمكنك مراجعة سورة يس كاملة من التبويب المخصص.
              </p>
            </div>
          ) : (
            <>
              {/* Quick Jump Banner to Training & Repeat Mode */}
              <div className="bg-linear-to-r from-amber-500/15 via-emerald-500/15 to-teal-500/15 p-4 rounded-3xl border border-amber-300/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Headphones className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-stone-900">
                      مُختبر التدريب والتصحيح التفاعلي (اسمع للشيخ وردّد وصحّح)
                    </h4>
                    <p className="text-[11px] text-stone-600">
                      تدرّب على آيات الواجب آية بآية مع فحص أحكام التجويد (النون والميم الساكنة، المدود، القلقلة) قبل إرسال التسجيل النهائي.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('training')}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <span>بدء التدريب الفوري</span>
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                </button>
              </div>

              {/* Mishary Alafasy Recitation Player */}
              <MisharyAyahPlayer
                startAyah={currentAssignment.startAyah}
                endAyah={currentAssignment.endAyah}
                activeAyah={activeAyahListening}
                onActiveAyahChange={setActiveAyahListening}
              />

              {/* Quranic Verses Display Box */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-xs relative">
                {/* Decorative title & badges */}
                <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <h2 className="text-sm font-bold text-emerald-950">
                      النص القرآني المعتمد والمشكول للآيات المحددة
                    </h2>
                  </div>
                  <span className="text-xs font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-full">
                    الآيات {currentAssignment.startAyah} - {currentAssignment.endAyah}
                  </span>
                </div>

                {/* Basmalah if starting from ayah 1 */}
                {currentAssignment.startAyah === 1 && (
                  <div className="text-center mb-6">
                    <p className="text-xl sm:text-2xl font-quran text-emerald-900 font-bold">
                      بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                    </p>
                  </div>
                )}

                {/* Verses Container */}
                <div className="bg-[#fcfbf7] rounded-2xl p-6 sm:p-8 border border-amber-100 shadow-inner">
                  <div className="text-right leading-loose text-2xl sm:text-3xl font-quran text-stone-900 select-none">
                    {currentAyahs.map((ayah) => {
                      const isHighlighted = activeAyahListening === ayah.number;
                      return (
                        <span
                          key={ayah.number}
                          className={`inline rounded-xl px-1.5 py-0.5 transition-all duration-300 ${
                            isHighlighted
                              ? 'bg-emerald-100 text-emerald-950 font-bold ring-2 ring-emerald-500 shadow-xs'
                              : ''
                          }`}
                        >
                          <span>{ayah.text}</span>
                          <span
                            className={`inline-flex items-center justify-center w-8 h-8 mx-2 rounded-full border text-xs font-mono font-bold align-middle shadow-xs transition-colors ${
                              isHighlighted
                                ? 'bg-emerald-700 text-white border-emerald-800 scale-110'
                                : 'border-amber-600/70 text-amber-900 bg-amber-100/70'
                            }`}
                          >
                            {ayah.number}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                </div>

                {currentAssignment.instructions && (
                  <div className="mt-4 p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600 flex items-start gap-2">
                    <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span><strong>توجيه المعلم:</strong> {currentAssignment.instructions}</span>
                  </div>
                )}
              </div>

              {/* Submission Status or Recorder */}
              {existingSubmission ? (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-200 shadow-xs space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
                    <div className="flex items-center gap-2.5 text-emerald-800">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                      <div>
                        <h3 className="font-bold text-sm text-stone-900">
                          تم إرسال تلاوة هذا الواجب بنجاح
                        </h3>
                        <p className="text-xs text-stone-500">
                          بتاريخ {new Date(existingSubmission.submittedAt).toLocaleDateString('ar-SA')} • المدة: {existingSubmission.durationSeconds} ثانية
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setCurrentEvaluation({
                          accuracyPercentage: existingSubmission.accuracyPercentage,
                          aiScore: existingSubmission.aiScore,
                          tajweedScore: existingSubmission.tajweedScore ?? existingSubmission.aiScore,
                          tajweedReport: existingSubmission.tajweedReport,
                          wordEvaluations: existingSubmission.wordEvaluations,
                          transcribedText: existingSubmission.transcribedText,
                          summaryFeedback: existingSubmission.teacherNotes || 'تلاوة محفوظة',
                          correctCount: 0,
                          missingCount: 0,
                          mispronouncedCount: 0,
                        });
                        setSubmittedAudioBase64(existingSubmission.audioBase64);
                        setShowEvaluationModal(true);
                      }}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>عرض تفاصيل تقييم التلاوة والتجويد</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-center">
                      <span className="text-[10px] text-stone-500 block">التقييم العام</span>
                      <span className="text-xl font-bold font-mono text-emerald-800">
                        {existingSubmission.aiScore} / 10
                      </span>
                    </div>
                    <div className="bg-teal-50 p-3 rounded-xl border border-teal-200 text-center">
                      <span className="text-[10px] text-teal-700 block font-bold">درجة التجويد</span>
                      <span className="text-xl font-bold font-mono text-teal-900">
                        {existingSubmission.tajweedScore !== undefined ? existingSubmission.tajweedScore : existingSubmission.aiScore} / 10
                      </span>
                    </div>
                    <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-center">
                      <span className="text-[10px] text-stone-500 block">نسبة الدقة</span>
                      <span className="text-xl font-bold font-mono text-amber-800">
                        {existingSubmission.accuracyPercentage}%
                      </span>
                    </div>
                    <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-center">
                      <span className="text-[10px] text-stone-500 block">درجة المعلم</span>
                      <span className="text-xl font-bold font-mono text-stone-800">
                        {existingSubmission.teacherGrade !== null ? `${existingSubmission.teacherGrade} / 10` : 'قيد المراجعة'}
                      </span>
                    </div>
                  </div>

                  {/* Audio Player for this submitted recording */}
                  <div>
                    <span className="text-xs font-bold text-stone-700 block mb-2">
                      تسجيلك الصوتي المرسل:
                    </span>
                    <AudioPlayer audioSrc={existingSubmission.audioBase64} />
                  </div>

                  {existingSubmission.teacherNotes && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                      <strong>ملاحظات وتوجيهات المعلم:</strong> {existingSubmission.teacherNotes}
                    </div>
                  )}
                </div>
              ) : (
                /* Active Audio Recorder */
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-700" />
                      <span className="text-sm font-bold text-stone-900">
                        سجل تلاوتك بصوتك الآن
                      </span>
                    </div>
                    <span className="text-xs text-stone-500">
                      سيتم فحص الكلمات وحساب الدقة والدرجة تلقائياً
                    </span>
                  </div>

                  <AudioRecorder
                    onRecitationCompleted={handleRecitationCompleted}
                    isEvaluating={isEvaluating}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* VIEW 2: INTERACTIVE TRAINING & REPEAT MODE */}
      {activeTab === 'training' && (
        <div className="space-y-6">
          {currentAssignment ? (
            <InteractiveTrainingMode
              startAyah={currentAssignment.startAyah}
              endAyah={currentAssignment.endAyah}
              assignmentTitle={currentAssignment.title}
              onFinishTraining={() => setActiveTab('current-assignment')}
            />
          ) : (
            <div className="bg-white rounded-3xl p-10 text-center border border-stone-200 shadow-xs">
              <p className="text-sm font-bold text-stone-700">يرجى اختيار واجب مسند أولاً لبدء التدريب التفاعلي عليه.</p>
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: RECIEVED HISTORY & PROGRESS */}
      {activeTab === 'my-history' && (
        <StudentHistory submissions={mySubmissions} />
      )}

      {/* VIEW 4: FULL SURAH YASIN */}
      {activeTab === 'full-surah' && (
        <SurahYasinView />
      )}

      {/* Evaluation Results Modal */}
      {currentEvaluation && (
        <EvaluationModal
          isOpen={showEvaluationModal}
          onClose={() => setShowEvaluationModal(false)}
          aiScore={currentEvaluation.aiScore}
          accuracyPercentage={currentEvaluation.accuracyPercentage}
          tajweedScore={currentEvaluation.tajweedScore}
          tajweedReport={currentEvaluation.tajweedReport}
          wordEvaluations={currentEvaluation.wordEvaluations}
          summaryFeedback={currentEvaluation.summaryFeedback}
          audioBase64={submittedAudioBase64}
          onGoToHistory={() => setActiveTab('my-history')}
        />
      )}
    </div>
  );
};
