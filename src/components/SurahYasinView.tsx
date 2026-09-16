import React, { useState } from 'react';
import { BookOpen, Search, Sparkles } from 'lucide-react';
import { SURAH_YASIN } from '../data/surahYasin';
import { MisharyAyahPlayer } from './MisharyAyahPlayer';

export const SurahYasinView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedAyah, setHighlightedAyah] = useState<number | null>(null);

  const filteredVerses = SURAH_YASIN.filter((ayah) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim();
    if (/^\d+$/.test(q)) {
      return ayah.number === parseInt(q, 10);
    }
    return ayah.text.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 bg-amber-400/20 text-amber-300 rounded-lg border border-amber-400/30">
                <BookOpen className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold text-amber-200">القرآن الكريم</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-quran text-amber-300">
              سُورَةُ يس (كاملة ومشكولة)
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/80 mt-1">
              مكية • عدد آياتها 83 آية • قلب القرآن الكريم
            </p>
          </div>

          {/* Search Ayah Input */}
          <div className="w-full md:w-72 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث برقم الآية أو بكلمة..."
              className="w-full bg-white/10 hover:bg-white/15 focus:bg-white/20 text-white placeholder:text-white/60 text-xs px-9 py-2.5 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-amber-300 transition-all"
            />
            <Search className="w-4 h-4 text-white/60 absolute right-3 top-3" />
          </div>
        </div>
      </div>

      {/* Basmalah Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-xs text-center">
        <p className="text-2xl sm:text-3xl font-quran text-emerald-950 tracking-wider">
          بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
        </p>
      </div>

      {/* Mishary Alafasy Reciter Player for Surah Yasin */}
      <MisharyAyahPlayer
        startAyah={1}
        endAyah={83}
        activeAyah={highlightedAyah}
        onActiveAyahChange={setHighlightedAyah}
      />

      {/* Verses Grid/List */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-xs space-y-4">
        {filteredVerses.length === 0 ? (
          <div className="py-10 text-center text-stone-400 text-xs">
            لا توجد آيات مطابقة للبحث
          </div>
        ) : (
          <div className="space-y-4">
            {filteredVerses.map((ayah) => (
              <div
                key={ayah.number}
                onClick={() => setHighlightedAyah(ayah.number)}
                className={`p-4 rounded-2xl transition-all cursor-pointer border ${
                  highlightedAyah === ayah.number
                    ? 'bg-amber-50/80 border-amber-300 shadow-xs'
                    : 'bg-stone-50/60 hover:bg-emerald-50/50 border-stone-100'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 text-right">
                    <p className="text-xl sm:text-2xl font-quran text-stone-900 leading-loose">
                      {ayah.text}
                      <span className="inline-flex items-center justify-center w-7 h-7 mx-2 rounded-full border border-amber-500/60 text-amber-800 text-xs font-mono font-bold bg-amber-50 align-middle">
                        {ayah.number}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
