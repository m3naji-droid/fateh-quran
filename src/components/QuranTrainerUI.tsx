import React, { useState } from 'react';
import { evaluateStudentRecitation, TrainingResult } from './quranTrainerLogic';

export const QuranTrainerUI: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [result, setResult] = useState<TrainingResult | null>(null);
  const [simulatedInput, setSimulatedInput] = useState("يس والقرآن الحكين إنك لمن المرسلين");

  // محاكاة عملية التسجيل الصوتي وإرسال النص لمحرّك المعالجة
  const handleStartTraining = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      // تشغيل المحرك المنطقي لتقييم الآيات (مثال: سورة يس من الآية 1 إلى 3)
      const evaluation = evaluateStudentRecitation(simulatedInput, 1, 3, 5);
      setResult(evaluation);
    }, 2000); // محاكاة مدة التسجيل لثانيتين
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow-md space-y-4 text-right" dir="rtl">
      <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">مدرب القرآن الكريم الذكي</h2>
      
      <p className="text-sm text-gray-600">
        اضغط على زر التسجيل واقرأ الآيات (من الآية 1 إلى 3 من سورة يس)، وسيقوم المدرب بتحليلك كأن شيخاً يجلس أمامك.
      </p>

      {/* حقل محاكاة الصوت المنطوق (يمكن ربطه لاحقاً بـ Web Audio API أو ميكروفون المتصفح) */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-500">النص المنطوق (محاكاة أو ناتج STT):</label>
        <input 
          type="text" 
          value={simulatedInput} 
          onChange={(e) => setSimulatedInput(e.target.value)}
          className="w-full p-2 border rounded-md text-sm"
        />
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleStartTraining}
          disabled={isRecording}
          className={`px-6 py-3 rounded-full text-white font-bold transition-all ${
            isRecording ? 'bg-red-500 animate-pulse' : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          {isRecording ? 'جاري الاستماع والتسجيل...' : '🎤 ابدأ التلاوة والتسجيل'}
        </button>
      </div>

      {/* عرض نتائج التحليل والتقييم */}
      {result && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border space-y-3">
          <h3 className="font-bold text-lg text-emerald-800">تقرير المدرب الذكي:</h3>
          
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="bg-white p-2 rounded shadow-sm">
              <span className="block text-gray-500">الدقة العامة</span>
              <span className="font-bold text-emerald-600">{result.accuracyPercentage}%</span>
            </div>
            <div className="bg-white p-2 rounded shadow-sm">
              <span className="block text-gray-500">صحة النطق</span>
              <span className="font-bold text-blue-600">{result.pronunciationScore} / 10</span>
            </div>
            <div className="bg-white p-2 rounded shadow-sm">
              <span className="block text-gray-500">درجة التجويد</span>
              <span className="font-bold text-purple-600">{result.tajweedScore} / 10</span>
            </div>
          </div>

          <div className="p-3 bg-emerald-50 text-emerald-900 rounded-md text-sm font-medium">
            💡 <strong>توجيه الشيخ:</strong> {result.summaryFeedback}
          </div>

          {/* تلوين وتقييم الكلمات كلمة بكلمة */}
          <div>
            <h4 className="text-xs font-bold text-gray-500 mb-1">تفصيل الكلمات المنطوقة:</h4>
            <div className="flex flex-wrap gap-2">
              {result.wordEvaluations.map((item, idx) => {
                let colorClass = "bg-green-100 text-green-800";
                if (item.status === 'mispronounced') colorClass = "bg-yellow-100 text-yellow-800";
                if (item.status === 'missing') colorClass = "bg-red-100 text-red-800";

                return (
                  <span key={idx} className={`px-2.5 py-1 rounded text-sm font-semibold ${colorClass}`}>
                    {item.word}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
