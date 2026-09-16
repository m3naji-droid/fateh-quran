import React from 'react';
import { BookOpen, LogOut, User, Sparkles, GraduationCap, ShieldCheck } from 'lucide-react';
import { CurrentUser } from '../types';

interface NavbarProps {
  currentUser: CurrentUser;
  onLogout: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  teacherTab?: 'submissions' | 'classes' | 'assignments';
  onTeacherTabChange?: (tab: 'submissions' | 'classes' | 'assignments') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  activeTab,
  onTabChange,
  teacherTab,
  onTeacherTabChange,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-linear-to-br from-emerald-700 to-teal-900 text-amber-300 flex items-center justify-center shadow-md shadow-emerald-900/10 border border-amber-400/30">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-emerald-950 tracking-tight">مَقْرَأَةُ الفَاتِح</span>
                <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-300/60">
                  سورة يس
                </span>
              </div>
              <p className="text-xs text-stone-500 font-medium">منصة تصحيح التلاوة بالذكاء الاصطناعي</p>
            </div>
          </div>

          {/* Teacher Navigation Navigation Pills */}
          {currentUser.role === 'teacher' && onTeacherTabChange && (
            <div className="hidden md:flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl border border-stone-200">
              <button
                onClick={() => onTeacherTabChange('submissions')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  teacherTab === 'submissions'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-stone-600 hover:text-emerald-800 hover:bg-stone-200/60'
                }`}
              >
                استجابات الطلاب
              </button>
              <button
                onClick={() => onTeacherTabChange('classes')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  teacherTab === 'classes'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-stone-600 hover:text-emerald-800 hover:bg-stone-200/60'
                }`}
              >
                إدارة الصفوف والطلاب
              </button>
              <button
                onClick={() => onTeacherTabChange('assignments')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  teacherTab === 'assignments'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-stone-600 hover:text-emerald-800 hover:bg-stone-200/60'
                }`}
              >
                إسناد واجب أسبوعي
              </button>
            </div>
          )}

          {/* Student Navigation Pills */}
          {currentUser.role === 'student' && onTabChange && (
            <div className="hidden md:flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl border border-stone-200">
              <button
                onClick={() => onTabChange('current-assignment')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'current-assignment'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-stone-600 hover:text-emerald-800 hover:bg-stone-200/60'
                }`}
              >
                الواجب والتسجيل
              </button>
              <button
                onClick={() => onTabChange('training')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'training'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-amber-900 bg-amber-100/80 hover:bg-amber-200/80 border border-amber-300/60'
                }`}
              >
                <span>مُختبر التدريب (اسمع وردّد)</span>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              </button>
              <button
                onClick={() => onTabChange('my-history')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'my-history'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-stone-600 hover:text-emerald-800 hover:bg-stone-200/60'
                }`}
              >
                سجل تلاواتي وتقدمي
              </button>
              <button
                onClick={() => onTabChange('full-surah')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'full-surah'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-stone-600 hover:text-emerald-800 hover:bg-stone-200/60'
                }`}
              >
                سورة يس كاملة
              </button>
            </div>
          )}

          {/* User Profile Info & Logout */}
          <div className="flex items-center gap-3">
            {currentUser.role === 'teacher' && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 rounded-xl">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-emerald-950">المعلم: {currentUser.teacherName}</p>
                  <p className="text-[10px] text-emerald-600 font-medium">مشرف المقرأة</p>
                </div>
              </div>
            )}

            {currentUser.role === 'student' && currentUser.student && (
              <div className="flex items-center gap-2 bg-amber-50/80 border border-amber-200/80 px-3 py-1.5 rounded-xl">
                <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-amber-950">{currentUser.student.name}</p>
                  <p className="text-[10px] text-amber-700 font-medium">
                    {currentUser.classRoom?.name || 'الصف الدراسي'} • #{currentUser.student.personalNumber}
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100/80 border border-red-200 rounded-xl transition-colors"
              title="تسجيل الخروج"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">خروج</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
