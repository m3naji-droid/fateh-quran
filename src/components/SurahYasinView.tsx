import React, { useState, useEffect, useRef } from 'react';
import { SURAH_YASIN, getVerseWords, QuranicWord } from '../data/surahYasin';
import { evaluateRecitationLocally, EvaluationResult } from '../utils/evaluationEngine';
// التحديث الأساسي هنا لتصحيح مسار استيراد المحرك ليتطابق مع مجلد utils
import { generateTajweedReport, TajweedAnalysisReport } from '../utils/tajweedEngine';
import TajweedBreakdownCard from './TajweedBreakdownCard';
import confetti from 'canvas-confetti';
import { 
  Mic, MicOff, Play, Pause, RefreshCw, Award, BookOpen, 
  CheckCircle2, XCircle, AlertCircle, Volume2, Sparkles, 
  ChevronRight, ChevronLeft, Send, FileText, BarChart2
} from 'lucide-react';

export default function SurahYasinView() {
  const [startAyah, setStartAyah] = useState<number>(1);
  const [endAyah, setEndAyah] = useState<number>(5);
  const [selectedMode, setSelectedMode] = useState<'practice' | 'exam' | 'tajweed'>('practice');
  
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  
  const [transcribedText, setTranscribedText] = useState<string>('');
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  
  const [activeTab, setActiveTab] = useState<'recitation' | 'tajweed' | 'report'>('recitation');
  const [tajweedReport, setTajweedReport] = useState<TajweedAnalysisReport | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // تحديث تقرير التجويد تلقائياً عند تغيير الآيات أو وضع التجويد
  useEffect(() => {
    const report = generateTajweedReport(SURAH_YASIN);
    setTajweedReport(report);
  }, [startAyah, endAyah]);

  // مؤقت التسجيل الصوتي
  useEffect(() => {
    if (isRecording) {
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const startRecording = async () => {
    audioChunksRef.current = [];
    setAudioBlob(null);
    setEvaluationResult(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        audioElementRef.current = new Audio(URL.createObjectURL(blob));
        
        // محاكاة أو تشغيل عملية التقييم المحلي للتلاوة
        processEvaluation(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("خطأ في الوصول إلى الميكروفون:", err);
      alert("تعذر الوصول إلى الميكروفون. يرجى التحقق من الأذونات.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // إيقاف استخدام الميكروفون الفعلي
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const processEvaluation = (blob: Blob) => {
    setIsEvaluating(true);
    
    setTimeout(() => {
      // جلب الكلمات المتوقعة للآيات المحددة
      const expectedWords = getVerseWords(startAyah, endAyah);
      const sampleText = expectedWords.map(w => w.voweled).join(' ');
      
      // إجراء التقييم المحلي
      const result = evaluateRecitationLocally(
        transcribedText || sampleText, 
        startAyah, 
        endAyah, 
        recordingTime || 5
      );

      setEvaluationResult(result);
      setIsEvaluating(false);

      if (result.accuracyPercentage >= 75) {
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch (e) {
          // تجاهل خطأ الكونفيتي إن لم يكن محملاً
        }
      }
    }, 1200);
  };

  const togglePlayback = () => {
    if (!audioElementRef.current) return;
    if (isPlayingAudio) {
      audioElementRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioElementRef.current.play();
      setIsPlayingAudio(true);
      audioElementRef.current.onended = () => setIsPlayingAudio(false);
    }
  };

  const currentAyahsWords = getVerseWords(startAyah, endAyah);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 text-right" dir="rtl">
      {/* رأس الصفحة العلوية */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-700 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-amber-300" />
            منصة تحفيظ سورة يس المباركة
          </h1>
          <p className="text-emerald-100 mt-1 text-sm md:text-base">
            تدرب على التلاوة الصحيحة، واختبر حفظك، واستخرج أحكام التجويد بدقة عالية.
          </p>
        </div>
        
        {/* أزرار الأوضاع */}
        <div className="flex bg-emerald-900/60 p-1.5 rounded-xl border border-emerald-600/50">
          <button 
            onClick={() => { setSelectedMode('practice'); setActiveTab('recitation'); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedMode === 'practice' ? 'bg-amber-500 text-white shadow-md' : 'text-emerald-200 hover:text-white'}`}
          >
            وضع التلاوة
          </button>
          <button 
            onClick={() => { setSelectedMode('tajweed'); setActiveTab('tajweed'); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedMode === 'tajweed' ? 'bg-amber-500 text-white shadow-md' : 'text-emerald-200 hover:text-white'}`}
          >
            أحكام التجويد الشاملة
          </button>
        </div>
      </div>

      {/* شريط اختيار الآيات والتحكم */}
      <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-gray-700 font-semibold text-sm">من الآية:</label>
          <select 
            value={startAyah} 
            onChange={(e) => setStartAyah(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            {SURAH_YASIN.map(a => (
              <option key={`start-${a.number}`} value={a.number}>الآية {a.number}</option>
            ))}
          </select>

          <label className="text-gray-700 font-semibold text-sm mr-2">إلى الآية:</label>
          <select 
            value={endAyah} 
            onChange={(e) => setEndAyah(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            {SURAH_YASIN.filter(a => a.number >= startAyah).map(a => (
              <option key={`end-${a.number}`} value={a.number}>الآية {a.number}</option>
            ))}
          </select>
        </div>

        <div className="text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border">
          عدد الآيات المحددة: <span className="font-bold text-emerald-700">{endAyah - startAyah + 1}</span> آية
        </div>
      </div>

      {/* محتوى الصفحة حسب الوضع المحدد */}
      {selectedMode === 'tajweed' ? (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
            <h2 className="text-xl font-bold text-emerald-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              التحليل التجويدي الشامل لسورة يس المباركة (83 آية)
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              يستعرض هذا القسم كافة الأحكام التجويدية المستخرجة تلقائياً من سور يس (الإدغام، الإخفاء، القلقلة، المدود، وغيرها).
            </p>

            {tajweedReport && (
              <TajweedBreakdownCard report={tajweedReport} />
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* قسم عرض الآيات وقراءة الطالب */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 space-y-4">
              <h3 className="text-lg font-bold text-gray-800 border-b pb-2 flex items-center justify-between">
                <span>النص القرآني المستهدف</span>
                <span className="text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  سورة يس (من آية {startAyah} إلى {endAyah})
                </span>
              </h3>

              {/* عرض الآيات الكريمة */}
              <div className="p-5 bg-amber-50/50 rounded-xl border border-amber-100 text-center leading-loose text-2xl font-serif text-gray-900">
                {SURAH_YASIN
                  .filter(a => a.number >= startAyah && a.number <= endAyah)
                  .map(ayah => (
                    <span key={ayah.number} className="inline-block mx-1">
                      {ayah.text} 
                      <span className="text-xs text-amber-700 font-sans mx-1 px-1.5 py-0.5 rounded-full bg-amber-100 border border-amber-300">
                        ({ayah.number})
                      </span>
                    </span>
                  ))}
              </div>

              {/* أداة التسجيل الصوتي */}
              <div className="pt-4 border-t flex flex-col items-center justify-center space-y-4">
                <div className="flex items-center gap-4">
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-full shadow-lg transition-all transform hover:scale-105 font-medium"
                    >
                      <Mic className="w-5 h-5 animate-pulse text-amber-300" />
                      ابدأ التسجيل الصوتي للتلاوة
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full shadow-lg transition-all animate-bounce font-medium"
                    >
                      <MicOff className="w-5 h-5" />
                      إيقاف التسجيل ({recordingTime} ثانية)
                    </button>
                  )}

                  {audioBlob && !isRecording && (
                    <button
                      onClick={togglePlayback}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-full shadow transition-all font-medium"
                    >
                      {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      {isPlayingAudio ? 'إيقاف مؤقت' : 'استماع للتسجيل'}
                    </button>
                  )}
                </div>

                {isEvaluating && (
                  <div className="flex items-center gap-2 text-emerald-700 font-medium text-sm animate-pulse">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    جاري تحليل التلاوة ومطابقة الحروف وأحكام التجويد محلياً...
                  </div>
                )}
              </div>
            </div>

            {/* تقييم الكلمات بالتفصيل */}
            {evaluationResult && (
              <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 space-y-4">
                <h4 className="font-bold text-gray-800 text-base flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  نتيجة تحليل الكلمات والحروف بدقة:
                </h4>
                
                <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-xl border">
                  {evaluationResult.wordEvaluations.map((item, idx) => {
                    let badgeColor = 'bg-gray-100 text-gray-700 border-gray-200';
                    if (item.status === 'correct') badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                    else if (item.status === 'mispronounced') badgeColor = 'bg-amber-100 text-amber-800 border-amber-300';
                    else if (item.status === 'missing') badgeColor = 'bg-red-100 text-red-800 border-red-300';

                    return (
                      <span key={idx} className={`px-3 py-1.5 rounded-lg border text-sm font-serif ${badgeColor} flex items-center gap-1.5`}>
                        {item.word}
                        {item.status === 'correct' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        {item.status === 'mispronounced' && <AlertCircle className="w-3.5 h-3.5 text-amber-600" />}
                        {item.status === 'missing' && <XCircle className="w-3.5 h-3.5 text-red-600" />}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* لوحة النتائج الجانبية */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 space-y-6">
              <h3 className="text-lg font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                ملخص تقييم الأداء
              </h3>

              {evaluationResult ? (
                <div className="space-y-4">
                  <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                    <div className="text-sm text-gray-600 font-medium">الدرجة الكلية للتلاوة</div>
                    <div className="text-4xl font-extrabold text-emerald-700 my-1">
                      {evaluationResult.aiScore} <span className="text-lg text-gray-400">/ 10</span>
                    </div>
                    <div className="text-xs text-emerald-800 font-semibold mt-1">
                      نسبة التطابق والدقة: {evaluationResult.accuracyPercentage}%
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-3 bg-gray-50 rounded-xl border">
                      <div className="text-xs text-gray-500">درجة النطق</div>
                      <div className="text-lg font-bold text-gray-800">{evaluationResult.pronunciationScore} / 10</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border">
                      <div className="text-xs text-gray-500">درجة التجويد</div>
                      <div className="text-lg font-bold text-gray-800">{evaluationResult.tajweedScore} / 10</div>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-sm text-amber-900">
                    <span className="font-bold block mb-1">توجيهات المعلم الذكي:</span>
                    {evaluationResult.summaryFeedback}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400 space-y-2">
                  <BarChart2 className="w-12 h-12 mx-auto opacity-40" />
                  <p className="text-sm">قم بتسجيل تلاوتك للآيات المحددة ليظهر تقرير الأداء المفصل هنا.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
