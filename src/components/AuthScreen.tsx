import React, { useState } from 'react';
import { BookOpen, User, Lock, KeyRound, ShieldCheck, GraduationCap, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { ClassRoom, Student } from '../types';

interface AuthScreenProps {
  classes: ClassRoom[];
  students: Student[];
  onTeacherLogin: (teacherName: string) => void;
  onStudentLogin: (student: Student, classRoom: ClassRoom) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  classes,
  students,
  onTeacherLogin,
  onStudentLogin,
}) => {
  const [authRole, setAuthRole] = useState<'student' | 'teacher'>('student');

  // Teacher credentials state
  const [teacherUsername, setTeacherUsername] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [teacherError, setTeacherError] = useState('');

  // Student credentials state
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [personalNumberInput, setPersonalNumberInput] = useState<string>('');
  const [studentError, setStudentError] = useState('');

  // Filter students for the selected class
  const classStudents = students.filter((s) => s.classId === selectedClassId);

  const handleClassChange = (newClassId: string) => {
    setSelectedClassId(newClassId);
    setSelectedStudentId('');
    setPersonalNumberInput('');
    setStudentError('');
  };

  const handleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherError('');

    // Verification against fixed credentials: Mohamed / M3naji
    if (teacherUsername.trim() === 'Mohamed' && teacherPassword === 'M3naji') {
      onTeacherLogin('Mohamed');
    } else {
      setTeacherError('اسم المستخدم أو كلمة المرور غير صحيحة.');
    }
  };

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStudentError('');

    if (!selectedClassId) {
      setStudentError('يرجى اختيار الصف الدراسي أولاً.');
      return;
    }

    if (!selectedStudentId) {
      setStudentError('يرجى اختيار اسمك من قائمة الطلاب.');
      return;
    }

    if (!personalNumberInput.trim()) {
      setStudentError('يرجى كتابة رقمك الشخصي.');
      return;
    }

    const student = students.find((s) => s.id === selectedStudentId);
    const classRoom = classes.find((c) => c.id === selectedClassId);

    if (!student || !classRoom) {
      setStudentError('تعذر العثور على بيانات الطالب.');
      return;
    }

    // Verify personal number
    if (student.personalNumber.trim() !== personalNumberInput.trim()) {
      setStudentError('الرقم الشخصي المدخل غير مطابق للاسم المختار. يرجى التأكد من الرقم.');
      return;
    }

    onStudentLogin(student, classRoom);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-emerald-100/80 overflow-hidden">
        {/* Top Islamic Banner Header */}
        <div className="bg-linear-to-br from-emerald-800 via-teal-800 to-emerald-950 text-white p-8 text-center relative overflow-hidden">
          {/* Subtle Quranic aesthetic motif */}
          <div className="relative z-10">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white/10 backdrop-blur-md border border-amber-300/40 text-amber-300 flex items-center justify-center shadow-lg shadow-emerald-950/20">
              <BookOpen className="w-9 h-9" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              مَقْرَأَةُ الفَاتِح
            </h1>
            <p className="text-xs text-emerald-100/80 mt-1">
              منصة تصحيح تلاوة القرآن الكريم لسورة يس
            </p>
          </div>
        </div>

        {/* Role Switcher Pills */}
        <div className="p-6 pb-2">
          <div className="flex bg-stone-100 p-1.5 rounded-2xl border border-stone-200">
            <button
              type="button"
              onClick={() => {
                setAuthRole('student');
                setStudentError('');
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                authRole === 'student'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-stone-600 hover:text-emerald-800'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>دخول الطالب</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthRole('teacher');
                setTeacherError('');
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                authRole === 'teacher'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-stone-600 hover:text-emerald-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>دخول المعلم</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 pt-3">
          {/* TEACHER LOGIN FORM */}
          {authRole === 'teacher' && (
            <form onSubmit={handleTeacherSubmit} className="space-y-4">
              {teacherError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{teacherError}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                  اسم المستخدم:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={teacherUsername}
                    onChange={(e) => setTeacherUsername(e.target.value)}
                    placeholder="اسم المستخدم"
                    className="w-full pl-3 pr-9 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  />
                  <User className="w-4 h-4 text-stone-400 absolute right-3 top-3" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                  كلمة السر:
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={teacherPassword}
                    onChange={(e) => setTeacherPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-3 pr-9 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  />
                  <Lock className="w-4 h-4 text-stone-400 absolute right-3 top-3" />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-900/10 transition-all cursor-pointer mt-2"
              >
                تسجيل الدخول كمعلم
              </button>
            </form>
          )}

          {/* STUDENT LOGIN FORM (NO COMPLEX PASSWORD) */}
          {authRole === 'student' && (
            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <p className="text-xs text-stone-500">
                تسجيل دخول سهل وسريع: اختر صفك واسمك ثم اكتب رقمك الشخصي
              </p>

              {studentError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{studentError}</span>
                </div>
              )}

              {/* 1. Select Class */}
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                  1. اختر الصف الدراسي:
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Select Student Name */}
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                  2. اختر اسمك:
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                >
                  <option value="">-- اختر اسم الطالب من القائمة --</option>
                  {classStudents.map((std) => (
                    <option key={std.id} value={std.id}>
                      {std.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Enter Personal ID */}
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                  3. الرقم الشخصي:
                </label>
                <input
                  type="text"
                  required
                  placeholder="أدخل رقمك الشخصي المسجل لدى المعلم"
                  value={personalNumberInput}
                  onChange={(e) => setPersonalNumberInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-linear-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-900/10 transition-all cursor-pointer mt-2"
              >
                تسجيل الدخول
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
