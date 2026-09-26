import React, { useState } from 'react';
import { evaluateStudentRecitationDynamic } from './quranTrainerLogic';

export const QuranTrainerUI: React.FC = () => {
  const [startAyah, setStartAyah] = useState<number>(1);
  const [endAyah, setEndAyah] = useState<number>(2); // دعم آية أو آيتين أو أكثر
  const [simulatedInput, setSimulatedInput] = useState("يس والقرآن الحكيم إنك لمن المرسلين");
  const [result, setResult] = useState<any>(null);

  const handleEvaluate = () => {
    const evaluation = evaluateStudentRecitationDynamic(simulatedInput, startAyah, endAyah);
    setResult(evaluation);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow-md space-y-4 text-right" dir="rtl">
      <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">مدرب القرآن الكريم (تقييم مرن للآيات)</h2>
      
      {/* إمكانية اختيار النطاق (آية واحدة، آيتين، أو أكثر) */}
      <div className="flex gap-4 items-center bg-gray-50 p-3 rounded-lg">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">من الآية:</label>
          <input 
            type="number" 
            value={startAyah} 
            onChange={(e) => setStartAyah(Number(e.target.value))}
            className="w-20 p-1 border rounded text-center"
            min={1}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">إلى الآية:</label>
          <input 
            type="number" 
            value={endAyah} 
            onChange={(e) => setEndAyah(Number(e.target.value))}
            className="w-20 p-1 border rounded text-center"
            min={1}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-500">النص المنطوق (تجربة آية أو عدة آيات):</label>
        <textarea 
          value={simulatedInput} 
          onChange={(e) => setSimulatedInput(e.target.value)}
          className="w-full p-2 border rounded-md text-sm h-20"
        />
      </div>

      <button
        onClick={handleEvaluate}
        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all"
      >
        🔍 تقييم التلاوة للآيات المحددة
      </button>

      {result && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border space-y-3">
          <h3 className="font-bold text-lg text-emerald-800">نتيجة التحليل والدقة:</h3>
          <div className="flex justify-around text-center text-sm font-semibold">
            <div>الدقة: <span className="text-emerald-600">{result.accuracyPercentage}%</span></div>
            <div>النطق: <span className="text-blue-600">{result.pronunciationScore}/10</span></div>
            <div>التجويد: <span className="text-purple-600">{result.tajweedScore}/10</span></div>
          </div>
          
          <p className="text-sm bg-emerald-50 p-2 rounded text-emerald-900 font-medium">
            {result.summaryFeedback}
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            {result.wordEvaluations.map((item: any, idx: number) => {
              let color = "bg-green-100 text-green-800";
              if (item.status === 'mispronounced') color = "bg-yellow-100 text-yellow-800";
              if (item.status === 'missing') color = "bg-red-100 text-red-800";
              return (
                <span key={idx} className={`px-2 py-1 rounded text-sm font-semibold ${color}`}>
                  {item.word}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
