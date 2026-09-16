import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, SkipBack, SkipForward, Headphones, Loader2 } from 'lucide-react';

interface MisharyAyahPlayerProps {
  startAyah: number;
  endAyah: number;
  activeAyah?: number | null;
  onActiveAyahChange?: (ayahNumber: number | null) => void;
}

// Generate EveryAyah high-quality MP3 URL for Surah Yasin (036) by Mishary Rashid Alafasy
export function getMisharyAyahAudioUrl(ayahNumber: number): string {
  const surahPadded = '036';
  const ayahPadded = ayahNumber.toString().padStart(3, '0');
  return `https://everyayah.com/data/Alafasy_128kbps/${surahPadded}${ayahPadded}.mp3`;
}

export const MisharyAyahPlayer: React.FC<MisharyAyahPlayerProps> = ({
  startAyah,
  endAyah,
  onActiveAyahChange,
}) => {
  const [currentPlayingAyah, setCurrentPlayingAyah] = useState<number>(startAyah);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // When assignment range changes, reset state
  useEffect(() => {
    setCurrentPlayingAyah(startAyah);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    onActiveAyahChange?.(null);
  }, [startAyah, endAyah]);

  // Handle active ayah change callback
  useEffect(() => {
    if (isPlaying) {
      onActiveAyahChange?.(currentPlayingAyah);
    } else {
      onActiveAyahChange?.(null);
    }
  }, [isPlaying, currentPlayingAyah]);

  // Play a specific ayah
  const playAyah = (ayahNum: number) => {
    if (ayahNum < startAyah || ayahNum > endAyah) {
      setIsPlaying(false);
      onActiveAyahChange?.(null);
      return;
    }

    setCurrentPlayingAyah(ayahNum);
    setIsLoading(true);

    if (audioRef.current) {
      audioRef.current.src = getMisharyAyahAudioUrl(ayahNum);
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
        })
        .catch((err) => {
          console.warn('Audio playback error', err);
          setIsLoading(false);
          setIsPlaying(false);
        });
    }
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      playAyah(currentPlayingAyah);
    }
  };

  const handleAyahEnded = () => {
    if (currentPlayingAyah < endAyah) {
      // Auto-advance to next ayah in assignment range
      const nextAyah = currentPlayingAyah + 1;
      playAyah(nextAyah);
    } else {
      // Finished all ayahs in the range
      setIsPlaying(false);
      setCurrentPlayingAyah(startAyah);
      onActiveAyahChange?.(null);
    }
  };

  const handlePrevious = () => {
    const prev = Math.max(startAyah, currentPlayingAyah - 1);
    playAyah(prev);
  };

  const handleNext = () => {
    const next = Math.min(endAyah, currentPlayingAyah + 1);
    playAyah(next);
  };

  const handleReset = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentPlayingAyah(startAyah);
    onActiveAyahChange?.(null);
  };

  const cycleSpeed = () => {
    const speeds = [1, 0.85, 1.15];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const newSpeed = speeds[nextIdx];
    setPlaybackSpeed(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  return (
    <div className="bg-linear-to-r from-emerald-50 via-teal-50/70 to-amber-50/50 rounded-2xl p-4 sm:p-5 border border-emerald-200/80 shadow-xs">
      <audio
        ref={audioRef}
        onEnded={handleAyahEnded}
        onError={() => {
          setIsLoading(false);
          setIsPlaying(false);
        }}
        preload="auto"
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Reciter Info & Current Ayah Status */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-amber-300 flex items-center justify-center shadow-md shadow-emerald-900/10 shrink-0 border border-emerald-600/60">
            <Headphones className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-emerald-950">
                استماع لترتيل الشيخ مشاري العفاسي
              </span>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300/70">
                مرتل ومجوَّد
              </span>
            </div>
            <p className="text-xs text-stone-600 mt-0.5 flex items-center gap-1.5">
              <span>استمع وتدرّب على التلاوة قبل التسجيل</span>
              <span className="text-stone-300">•</span>
              <span className="font-bold text-emerald-800">
                {isPlaying ? `يقرأ الآن الآية (${currentPlayingAyah})` : `جاهز للاستماع (الآيات ${startAyah} - ${endAyah})`}
              </span>
            </p>
          </div>
        </div>

        {/* Audio Controls */}
        <div className="flex items-center justify-end gap-2 flex-wrap">
          {/* Speed control */}
          <button
            type="button"
            onClick={cycleSpeed}
            className="px-2.5 py-1.5 rounded-xl bg-white border border-stone-200 hover:border-emerald-300 text-[11px] font-bold text-stone-700 hover:text-emerald-800 transition-all cursor-pointer shadow-2xs"
            title="تغيير سرعة القراءة للتمرن والترديد"
          >
            {playbackSpeed}x
          </button>

          {/* Previous Ayah */}
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentPlayingAyah <= startAyah}
            className="p-2 rounded-xl bg-white border border-stone-200 text-stone-700 hover:text-emerald-800 hover:bg-emerald-50 disabled:opacity-40 disabled:hover:bg-white transition-all cursor-pointer shadow-2xs"
            title="الآية السابقة"
          >
            <SkipForward className="w-4 h-4 rotate-180" />
          </button>

          {/* Main Play/Pause Button */}
          <button
            type="button"
            onClick={handleTogglePlay}
            disabled={isLoading}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-emerald-700 hover:bg-emerald-800 text-white'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري التحميل...</span>
              </>
            ) : isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-white" />
                <span>إيقاف مؤقت</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>استماع للآيات كاملة</span>
              </>
            )}
          </button>

          {/* Next Ayah */}
          <button
            type="button"
            onClick={handleNext}
            disabled={currentPlayingAyah >= endAyah}
            className="p-2 rounded-xl bg-white border border-stone-200 text-stone-700 hover:text-emerald-800 hover:bg-emerald-50 disabled:opacity-40 disabled:hover:bg-white transition-all cursor-pointer shadow-2xs"
            title="الآية التالية"
          >
            <SkipBack className="w-4 h-4 rotate-180" />
          </button>

          {/* Reset button */}
          <button
            type="button"
            onClick={handleReset}
            className="p-2 rounded-xl bg-white border border-stone-200 text-stone-500 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer shadow-2xs"
            title="إعادة البدء من الآية الأولى"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Interactive Ayah Navigation Pills */}
      <div className="mt-3.5 pt-3 border-t border-emerald-200/60 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        <span className="text-[11px] font-bold text-stone-500 shrink-0 ml-1">
          الانتقال المباشر لآية:
        </span>
        {Array.from({ length: endAyah - startAyah + 1 }, (_, i) => startAyah + i).map((num) => {
          const isThisAyah = currentPlayingAyah === num && isPlaying;
          return (
            <button
              key={num}
              type="button"
              onClick={() => playAyah(num)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-all shrink-0 cursor-pointer ${
                isThisAyah
                  ? 'bg-emerald-700 text-white shadow-xs scale-105 ring-2 ring-emerald-400'
                  : 'bg-white/80 hover:bg-emerald-100 text-stone-700 border border-stone-200'
              }`}
            >
              {num}
            </button>
          );
        })}
      </div>
    </div>
  );
};
