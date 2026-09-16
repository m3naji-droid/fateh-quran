import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, RotateCcw, Send, Play, Pause, AlertCircle, Sparkles, Volume2 } from 'lucide-react';

interface AudioRecorderProps {
  onRecitationCompleted: (audioBase64: string, durationSeconds: number, transcribedText: string) => void;
  isEvaluating?: boolean;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onRecitationCompleted,
  isEvaluating = false,
}) => {
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'recorded'>('idle');
  const [recordDuration, setRecordDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [base64Audio, setBase64Audio] = useState<string | null>(null);
  const [transcribedText, setTranscribedText] = useState<string>('');
  const [micPermissionError, setMicPermissionError] = useState<string | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition for Arabic if available in browser
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'ar-SA';

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript + ' ';
          }
          setTranscribedText(currentTranscript.trim());
        };

        recognition.onerror = (e: any) => {
          console.log('Speech recognition notice:', e.error);
        };

        recognitionRef.current = recognition;
      } catch (err) {
        console.warn('Speech recognition could not be initialized:', err);
      }
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
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

  const startRecording = async () => {
    setMicPermissionError(null);
    setTranscribedText('');
    audioChunksRef.current = [];
    setAudioUrl(null);
    setBase64Audio(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Determine best audio mimeType supported
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
        setAudioUrl(url);

        // Convert blob to Base64 data URL for durable storage and cross-session playback
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          setBase64Audio(base64data);
        };
        reader.readAsDataURL(audioBlob);

        // Stop all audio tracks to free mic indicator
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(250); // Slice every 250ms
      setRecordingState('recording');
      setRecordDuration(0);

      // Start duration counter
      timerIntervalRef.current = window.setInterval(() => {
        setRecordDuration(prev => prev + 1);
      }, 1000);

      // Start Arabic speech recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          // May already be running
        }
      }
    } catch (err: any) {
      console.error('Microphone error:', err);
      setMicPermissionError('يرجى السماح بصلاحية الميكروفون في المتصفح لتسجيل التلاوة.');
    }
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    setRecordingState('recorded');
  };

  const resetRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }
    setRecordingState('idle');
    setRecordDuration(0);
    setAudioUrl(null);
    setBase64Audio(null);
    setTranscribedText('');
    setIsPreviewPlaying(false);
  };

  const togglePreviewAudio = () => {
    if (!previewAudioRef.current) return;
    if (isPreviewPlaying) {
      previewAudioRef.current.pause();
      setIsPreviewPlaying(false);
    } else {
      previewAudioRef.current.play().then(() => {
        setIsPreviewPlaying(true);
      }).catch(() => {});
    }
  };

  const handleSubmit = () => {
    if (!base64Audio && !audioUrl) return;
    onRecitationCompleted(base64Audio || audioUrl || '', recordDuration, transcribedText);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm transition-all">
      {/* Status banner */}
      <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-4">
        <div className="flex items-center gap-2">
          {recordingState === 'recording' ? (
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
            </span>
          ) : (
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
          )}
          <span className="text-xs font-bold text-stone-700">
            {recordingState === 'idle' && 'جاهز للتسجيل - اضغط على الميكروفون وابدأ القراءة'}
            {recordingState === 'recording' && 'جاري تسجيل التلاوة بصوتك العذب...'}
            {recordingState === 'recorded' && 'تم إنهاء التسجيل بنجاح - استمع لتلاوتك قبل الإرسال'}
          </span>
        </div>

        {/* Timer display */}
        <div className="font-mono text-sm font-bold bg-stone-100 px-2.5 py-1 rounded-md text-stone-800">
          {formatTimer(recordDuration)}
        </div>
      </div>

      {micPermissionError && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{micPermissionError}</span>
        </div>
      )}

      {/* Recording Visualization Area */}
      <div className="flex flex-col items-center justify-center py-6 px-4 bg-stone-50/70 rounded-xl border border-dashed border-stone-200 mb-4">
        {recordingState === 'idle' && (
          <div className="flex flex-col items-center text-center gap-3">
            <button
              onClick={startRecording}
              className="w-18 h-18 rounded-full bg-linear-to-tr from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white flex items-center justify-center shadow-lg shadow-emerald-700/20 active:scale-95 transition-all cursor-pointer group"
              title="بدء التسجيل"
            >
              <Mic className="w-8 h-8 group-hover:scale-110 transition-transform" />
            </button>
            <div>
              <p className="text-sm font-bold text-emerald-950">انقر لبدء تسجيل التلاوة</p>
              <p className="text-xs text-stone-500 mt-0.5">تأكد من الهدوء حولك وقراءة الآيات بتمهل وترتيل</p>
            </div>
          </div>
        )}

        {recordingState === 'recording' && (
          <div className="flex flex-col items-center gap-4 w-full">
            {/* Animated audio wave bars */}
            <div className="flex items-center justify-center gap-1.5 h-12">
              {[40, 70, 30, 90, 60, 100, 45, 80, 50, 95, 35, 85, 60, 40].map((h, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-emerald-600 rounded-full animate-pulse"
                  style={{
                    height: `${h}%`,
                    animationDelay: `${(i % 5) * 150}ms`,
                    animationDuration: '800ms',
                  }}
                />
              ))}
            </div>

            {/* Live speech transcription badge if recognizing */}
            {transcribedText && (
              <div className="max-w-md text-center bg-white/90 px-3 py-1.5 rounded-lg border border-emerald-200 text-xs text-emerald-900 font-quran">
                "{transcribedText}"
              </div>
            )}

            <button
              onClick={stopRecording}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-md shadow-red-600/20 active:scale-95 transition-all cursor-pointer"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>إيقاف وإنهاء التسجيل</span>
            </button>
          </div>
        )}

        {recordingState === 'recorded' && audioUrl && (
          <div className="w-full flex flex-col items-center gap-4">
            <audio
              ref={previewAudioRef}
              src={audioUrl}
              onEnded={() => setIsPreviewPlaying(false)}
            />

            <div className="flex items-center gap-3">
              <button
                onClick={togglePreviewAudio}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95"
              >
                {isPreviewPlaying ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>إيقاف مؤقت</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>استماع للتسجيل ({formatTimer(recordDuration)})</span>
                  </>
                )}
              </button>

              <button
                onClick={resetRecording}
                className="flex items-center gap-1.5 px-3 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-xl text-xs font-semibold transition-all active:scale-95"
                title="إعادة التسجيل من جديد"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة التسجيل</span>
              </button>
            </div>
            
            <p className="text-[11px] text-stone-500">
              استمع للمقطع لتتأكد من نقاء الصوت ثم اضغط على زر "إرسال التلاوة للتصحيح الذكي" بالأسفل
            </p>
          </div>
        )}
      </div>

      {/* Submit Action Button */}
      {recordingState === 'recorded' && (
        <div className="pt-2">
          <button
            onClick={handleSubmit}
            disabled={isEvaluating}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-linear-to-r from-emerald-600 via-emerald-700 to-teal-800 hover:from-emerald-700 hover:to-teal-900 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-900/15 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-75"
          >
            {isEvaluating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>جاري تقييم التلاوة وفحص الكلمات بالذكاء الاصطناعي...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>إرسال التلاوة للتصحيح الذكي</span>
                <Send className="w-4 h-4 rotate-180" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
