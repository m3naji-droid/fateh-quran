import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, Pause, Mic, Square, RotateCcw, Volume2, Sparkles, CheckCircle2, 
  ArrowLeft, ArrowRight, BookOpen, AlertCircle, RefreshCw, Award, ChevronRight, ChevronLeft
} from 'lucide-react';
import { SURAH_YASIN } from '../data/surahYasin';
import { evaluateRecitationLocally, EvaluationResult } from '../utils/evaluationEngine';
import { analyzeTajweedForAyahs, TajweedRuleItem } from '../utils/tajweedEngine';
import { TajweedBreakdownCard } from './TajweedBreakdownCard';
import { AudioPlayer } from './AudioPlayer';

interface InteractiveTrainingModeProps {
  startAyah: number;
  endAyah: number;
  assignmentTitle: string;
  onFinishTraining?: () => void;
}

export const InteractiveTrainingMode: React.FC<InteractiveTrainingModeProps> = ({
  startAyah,
  endAyah,
  assignmentTitle,
  onFinishTraining
}) => {
  const [currentAyahNum, setCurrentAyahNum] = useState<number>(startAyah);
  const [isPlayingSheikh, setIsPlayingSheikh] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isLooping, setIsLooping] = useState(false);
  
  // Student recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [studentAudioUrl, setStudentAudioUrl] = useState<string | null>(null);
  const [studentAudioBase64, setStudentAudioBase64] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [ayahEvaluation, setAyahEvaluation] = useState<EvaluationResult | null>(null);
  const [micError, setMicError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const transcribedTextRef = useRef<string>('');

  // Get current Ayah object
  const currentAyah = SURAH_YASIN.find((a) => a.number === currentAyahNum) || SURAH_YASIN[0];

  // Specific Tajweed rules for this single Ayah
  const ayahTajweedReport = analyzeTajweedForAyahs(currentAyahNum, currentAyahNum, 95);

  // Stop playback & reset state when ayah changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlayingSheikh(false);
    setStudentAudioUrl(null);
    setStudentAudioBase64(null);
    setAyahEvaluation(null);
    setIsRecording(false);
    setRecordDuration(0);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  }, [currentAyahNum]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  const sheikhAudioSrc = `https://everyayah.com/data/Alafasy_128kbps/036${String(currentAyahNum).padStart(3, '0')}.mp3`;

  const toggleSheikhPlayback = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(sheikhAudioSrc);
      audioRef.current.playbackRate = playbackSpeed;
      
      audioRef.current.onended = () => {
        if (isLooping && audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play();
        } else {
          setIsPlayingSheikh(false);
        }
      };

      audioRef.current.onerror = () => {
        setIsPlayingSheikh(false);
      };
    }

    if (isPlayingSheikh) {
      audioRef.current.pause();
      setIsPlayingSheikh(false);
    } else {
      audioRef.current.src = sheikhAudioSrc;
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.play().then(() => {
        setIsPlayingSheikh(true);
      }).catch((e) => {
        console.warn('Playback prevented:', e);
        setIsPlayingSheikh(false);
      });
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  // Student Recording Logic
  const startRecording = async () => {
    setMicError(null);
    setStudentAudioUrl(null);
    setStudentAudioBase64(null);
    setAyahEvaluation(null);
    audioChunksRef.current = [];
    transcribedTextRef.current = '';

    // Stop Sheikh audio if playing
    if (audioRef.current && isPlayingSheikh) {
      audioRef.current.pause();
      setIsPlayingSheikh(false);
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeTypes = ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav'];
      let selectedMime = '';
      for (const m of mimeTypes) {
        if (MediaRecorder.isTypeSupported(m)) {
          selectedMime = m;
          break;
        }
      }

      const mediaRecorder = new MediaRecorder(stream, selectedMime ? { mimeType: selectedMime } : undefined);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: selectedMime || 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setStudentAudioUrl(url);

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          setStudentAudioBase64(base64data);
          analyzeStudentRecitation(base64data, transcribedTextRef.current, recordDuration);
        };

        // Stop media stream tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      // Browser Speech Recognition if supported
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const rec = new SpeechRecognition();
          rec.lang = 'ar-SA';
          rec.continuous = false;
          rec.interimResults = true;
          rec.onresult = (evt: any) => {
            let transcript = '';
            for (let i = 0; i < evt.results.length; i++) {
              transcript += evt.results[i][0].transcript + ' ';
            }
            transcribedTextRef.current = transcript.trim();
          };
          recognitionRef.current = rec;
          rec.start();
        } catch {}
      }

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordDuration(0);

      timerIntervalRef.current = window.setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone access denied:', err);
      setMicError('يرجى السماح بصلاحية الميكروفون من إعدادات المتصفح للبدء في التسجيل والتدريب.');
    }
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const analyzeStudentRecitation = (audioBase64: string, spokenText: string, duration: number) => {
    setIsAnalyzing(true);
    setTimeout(() => {
      // Evaluate locally for current ayah
      const result = evaluateRecitationLocally(
        spokenText,
        currentAyahNum,
        currentAyahNum,
        duration
      );
      setAyahEvaluation(result);
      setIsAnalyzing(false);
    }, 600);
  };

  const hasNextAyah = currentAyahNum < endAyah;
  const hasPrevAyah = currentAyahNum > startAyah;

  return (
    <div className="bg-white rounded-3xl border border-emerald-200/80 shadow-xs overflow-hidden space-y-6 p-6 sm:p-8">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-emerald-600 to-teal-800 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-emerald-950">
                مُخْتَبَرُ التَّدْرِيبِ وَالتَّرْدِيدِ التَّفَاعُلِي
              </h2>
              <span className="text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300/80 px-2.5 py-0.5 rounded-full">
                اسمع وردّد وصحّح
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
              استمع لقراءة الشيخ مشاري العفاسي، ثم سجّل قراءتك للآية مباشرة لتحصل على التقييم وتصحيح التجويد الفوري
            </p>
          </div>
        </div>

        {onFinishTraining && (
          <button
            onClick={onFinishTraining}
            className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>إتمام والعودة للواجب</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Ayah Navigation Tracker */}
      <div className="flex items-center justify-between bg-stone-50 p-3 rounded-2xl border border-stone-200">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-stone-700">التدريب على:</span>
          <span className="text-xs font-bold bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-lg border border-emerald-200">
            {assignmentTitle}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentAyahNum(prev => Math.max(startAyah, prev - 1))}
            disabled={!hasPrevAyah}
            className="p-2 rounded-xl bg-white border border-stone-300 text-stone-700 disabled:opacity-40 hover:bg-stone-100 transition-colors cursor-pointer"
            title="الآية السابقة"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <span className="text-xs font-bold font-mono px-3 py-1 bg-emerald-800 text-white rounded-xl shadow-xs">
            الآية {currentAyahNum} من {endAyah}
          </span>

          <button
            onClick={() => setCurrentAyahNum(prev => Math.min(endAyah, prev + 1))}
            disabled={!hasNextAyah}
            className="p-2 rounded-xl bg-white border border-stone-300 text-stone-700 disabled:opacity-40 hover:bg-stone-100 transition-colors cursor-pointer"
            title="الآية التالية"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Practice Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left/Main Column: Verse Text & Sheikh & Recording */}
        <div className="lg:col-span-7 space-y-6">
          {/* Verse Card */}
          <div className="bg-[#fcfbf7] rounded-3xl p-6 sm:p-8 border-2 border-amber-200/80 shadow-xs relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-extrabold text-amber-900 bg-amber-100 px-3 py-1 rounded-full border border-amber-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                سورة يس - الآية ({currentAyahNum})
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsLooping(!isLooping)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                    isLooping 
                      ? 'bg-amber-600 text-white border-amber-700' 
                      : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                  }`}
                  title="تكرار الآية تلقائياً للترديد خلف الشيخ"
                >
                  تكرار الآية {isLooping ? '✓' : ''}
                </button>
              </div>
            </div>

            {/* Uthmanic Text */}
            <div className="text-center py-6">
              <p className="text-3xl sm:text-4xl font-quran text-stone-900 leading-loose select-none">
                {currentAyah.text}
                <span className="inline-flex items-center justify-center w-9 h-9 mx-3 rounded-full border-2 border-amber-600 text-amber-950 text-sm font-mono font-bold bg-amber-100/90 align-middle shadow-xs">
                  {currentAyah.number}
                </span>
              </p>
            </div>

            {/* Quick Tajweed Highlights inside this Verse */}
            {ayahTajweedReport.allRules.length > 0 && (
              <div className="mt-4 pt-4 border-t border-amber-200/60 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-stone-700">الأحكام البارزة في الآية:</span>
                {ayahTajweedReport.allRules.map((rule, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-semibold bg-emerald-100/90 text-emerald-950 px-2 py-0.5 rounded-lg border border-emerald-300"
                    title={rule.tip}
                  >
                    {rule.ruleName}: «{rule.word}»
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Step 1: Listen to Sheikh Mishary */}
          <div className="bg-emerald-50/70 rounded-3xl p-5 border border-emerald-200 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-full bg-emerald-700 text-white text-xs font-black flex items-center justify-center font-mono">
                  1
                </span>
                <div>
                  <h4 className="text-sm font-extrabold text-emerald-950">
                    الخطوة الأولى: استمع لترتيل الشيخ مشاري العفاسي
                  </h4>
                  <p className="text-xs text-stone-600">
                    استمع جيداً لمخارج الحروف ومقادير المدود والغنن والقلقلة
                  </p>
                </div>
              </div>

              {/* Speed controls */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-emerald-200 text-[11px] font-mono">
                {[0.8, 1.0, 1.2].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => handleSpeedChange(spd)}
                    className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                      playbackSpeed === spd 
                        ? 'bg-emerald-700 text-white font-bold' 
                        : 'text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs">
              <button
                onClick={toggleSheikhPlayback}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md transition-transform active:scale-95 cursor-pointer ${
                  isPlayingSheikh
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                }`}
                title={isPlayingSheikh ? 'إيقاف مؤقت' : 'تشغيل قراءة الشيخ'}
              >
                {isPlayingSheikh ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 fill-current mr-0.5" />}
              </button>

              <div className="flex-1">
                <div className="flex items-center justify-between text-xs font-bold text-stone-700 mb-1">
                  <span>الشيخ مشاري راشد العفاسي</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                    isPlayingSheikh ? 'bg-emerald-100 text-emerald-800 animate-pulse' : 'bg-stone-100 text-stone-600'
                  }`}>
                    {isPlayingSheikh ? 'جارٍ الاستماع...' : 'جاهز للتشغيل'}
                  </span>
                </div>
                <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden border border-stone-200">
                  <div 
                    className={`h-full bg-emerald-600 rounded-full transition-all ${
                      isPlayingSheikh ? 'w-full duration-1000' : 'w-0'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Record student recitation for this ayah */}
          <div className="bg-amber-50/70 rounded-3xl p-5 border border-amber-200 space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-amber-700 text-white text-xs font-black flex items-center justify-center font-mono">
                2
              </span>
              <div>
                <h4 className="text-sm font-extrabold text-amber-950">
                  الخطوة الثانية: اقرأ بعد الشيخ وسجّل صوتك
                </h4>
                <p className="text-xs text-stone-600">
                  حاكي تلاوة الشيخ مع تطبيق أحكام التجويد بدقة
                </p>
              </div>
            </div>

            {micError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{micError}</span>
              </div>
            )}

            <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="w-14 h-14 rounded-2xl bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-md transition-transform active:scale-95 cursor-pointer shrink-0"
                    title="بدء تسجيل تلاوتي لهذه الآية"
                  >
                    <Mic className="w-7 h-7" />
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="w-14 h-14 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white flex items-center justify-center shadow-md transition-transform active:scale-95 cursor-pointer animate-pulse shrink-0"
                    title="إنهاء التسجيل والتصحيح"
                  >
                    <Square className="w-6 h-6 fill-current text-red-500" />
                  </button>
                )}

                <div>
                  <div className="text-sm font-bold text-stone-900">
                    {isRecording ? 'جارٍ تسجيل تلاوتك الآن...' : studentAudioUrl ? 'تم تسجيل تلاوتك بنجاح' : 'اضغط على زر الميكروفون للقراءة'}
                  </div>
                  <div className="text-xs text-stone-500 font-mono mt-0.5">
                    المدة: 00:{String(recordDuration).padStart(2, '0')} ثانية
                  </div>
                </div>
              </div>

              {/* Student audio player if recorded */}
              {studentAudioUrl && !isRecording && (
                <div className="w-full sm:w-64">
                  <AudioPlayer audioSrc={studentAudioUrl} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Step 3: Instant Evaluation & Tajweed Verification */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-stone-50 rounded-3xl p-5 border border-stone-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-teal-700 text-white text-xs font-black flex items-center justify-center font-mono">
                  3
                </span>
                <h4 className="text-sm font-extrabold text-stone-900">
                  الخطوة الثالثة: نتيجة التصحيح والتجويد
                </h4>
              </div>
              {ayahEvaluation && (
                <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                  {ayahEvaluation.accuracyPercentage}% دقة
                </span>
              )}
            </div>

            {isAnalyzing ? (
              <div className="py-12 text-center space-y-3 bg-white rounded-2xl border border-stone-200">
                <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-stone-700">
                  جارٍ فحص التلاوة وتدقيق أحكام التجويد ومخارج الحروف...
                </p>
              </div>
            ) : ayahEvaluation ? (
              <div className="space-y-4 animate-fadeIn">
                {/* Score badge */}
                <div className="p-4 rounded-2xl bg-linear-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-emerald-200 font-bold block">درجة إتقان الآية</span>
                    <span className="text-2xl font-black text-amber-300 font-mono">
                      {ayahEvaluation.aiScore.toFixed(1)} <span className="text-xs text-white">/ 10</span>
                    </span>
                  </div>
                  <div className="text-left">
                    <span className="text-[11px] text-emerald-200 font-bold block">درجة التجويد</span>
                    <span className="text-2xl font-black text-amber-300 font-mono">
                      {ayahEvaluation.tajweedScore.toFixed(1)} <span className="text-xs text-white">/ 10</span>
                    </span>
                  </div>
                </div>

                {/* Feedback notes */}
                <div className="p-3 bg-white rounded-2xl border border-emerald-100 text-xs text-stone-800">
                  <p className="font-bold text-emerald-950 mb-1">ملاحظة التصحيح:</p>
                  <p className="text-stone-600 leading-relaxed">
                    {ayahEvaluation.summaryFeedback}
                  </p>
                </div>

                {/* Word evaluations */}
                <div className="bg-white p-3.5 rounded-2xl border border-stone-200 space-y-2">
                  <span className="text-xs font-bold text-stone-900 block">
                    نطق كلمات الآية:
                  </span>
                  <div className="flex flex-wrap gap-1.5 font-quran text-lg text-right leading-loose">
                    {ayahEvaluation.wordEvaluations.map((w, idx) => (
                      <span
                        key={idx}
                        className={`px-2 py-0.5 rounded-lg border text-base ${
                          w.status === 'correct'
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                            : w.status === 'mispronounced'
                            ? 'bg-amber-50 text-amber-900 border-amber-300 font-bold'
                            : 'bg-red-50 text-red-900 border-red-200 line-through'
                        }`}
                        title={w.status === 'correct' ? 'نطق متقن' : 'انتبه لمخرج الكلمة وحركاتها'}
                      >
                        {w.word}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tajweed report breakdown for this ayah */}
                <TajweedBreakdownCard report={ayahEvaluation.tajweedReport} compact={true} />

                {/* Interactive Action Buttons */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={startRecording}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-amber-300"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>إعادة المحاولة للتدرب</span>
                  </button>

                  {hasNextAyah && (
                    <button
                      onClick={() => setCurrentAyahNum(prev => prev + 1)}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <span>الآية التالية</span>
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-10 px-4 text-center bg-white rounded-2xl border border-stone-200 text-stone-500 space-y-2">
                <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-stone-700">
                  سجل تلاوتك في الخطوة 2 لتظهر النتيجة والتصحيح التجويدي هنا
                </p>
                <p className="text-[11px] text-stone-400">
                  ستتم مراجعة أحكام النون الساكنة والتنوين والميم الساكنة والمدود والقلقلة والغنن آلياً
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
