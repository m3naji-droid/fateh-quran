import React, { useState } from 'react';
import { 
  Award, 
  BookOpen, 
  CheckCircle2, 
  Users, 
  GraduationCap, 
  Trash2, 
  Pencil, 
  Download, 
  Upload, 
  Search, 
  Check, 
  X, 
  UserX, 
  FileSpreadsheet, 
  Save, 
  AlertCircle 
} from 'lucide-react';

export const QuranSystemDashboard = () => {
  // الحالة العامة للتنقل بين الأقسام
  const [activeSection, setActiveSection] = useState<'students' | 'assignments' | 'evaluations'>('students');

  // بيانات وهمية للاختبار والتوضيح
  const [classes, setClasses] = useState([
    { id: 'c1', name: 'صف أول متوسط (أ)' },
    { id: 'c2', name: 'صف ثاني متوسط (ب)' }
  ]);

  const [students, setStudents] = useState([
    { id: 's1', classId: 'c1', name: 'محمد أحمد عبدالله', personalNumber: '123456789' },
    { id: 's2', classId: 'c1', name: 'عبدالله خالد إبراهيم', personalNumber: '987654321' }
  ]);

  const [assignments, setAssignments] = useState([
    { 
      id: 'asg1', 
      classId: 'c1', 
      title: 'تلاوة سورة يس (الآيات 1 - 12)', 
      startAyah: 1, 
      endAyah: 12, 
      instructions: 'الالتزام بمخرج الحروف والمد الطبيعي.', 
      createdAt: '2026-06-01' 
    }
  ]);

  // حالات نموذج إضافة طالب جديد
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentPersonalId, setNewStudentPersonalId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || '');

  // حالات الواجبات
  const [asgTitle, setAsgTitle] = useState('تلاوة سورة يس');
  const [asgClassId, setAsgClassId] = useState('all');
  const [asgStartAyah, setAsgStartAyah] = useState(1);
  const [asgEndAyah, setAsgEndAyah] = useState(12);
  const [asgInstructions, setAsgInstructions] = useState('');
  const [asgSuccessMsg, setAsgSuccessMsg] = useState('');

  // حالات نظام التقييم الجديد (مقسم إلى خانتين مستقلتين)
  const [letterPronunciationScore, setLetterPronunciationScore] = useState<number>(5); // من 5
  const [tajweedScore, setTajweedScore] = useState<number>(5); // من 5
  const totalScore = Number(letterPronunciationScore) + Number(tajweedScore); // المجموع الكلي من 10

  // حالات البحث والتصفية
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterClassFilter, setRosterClassFilter] = useState('all');

  // دوال الإضافة والمعالجة
  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName || !newStudentPersonalId) return;
    const newStudent = {
      id: 's_' + Date.now(),
      classId: selectedClassId,
      name: newStudentName,
      personalNumber: newStudentPersonalId
    };
    setStudents([...students, newStudent]);
    setNewStudentName('');
    setNewStudentPersonalId('');
  };

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    const newAsg = {
      id: 'asg_' + Date.now(),
      classId: asgClassId,
      title: asgTitle,
      startAyah: asgStartAyah,
      endAyah: asgEndAyah,
      instructions: asgInstructions,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setAssignments([...assignments, newAsg]);
    setAsgSuccessMsg('تم إسناد الواجب بنجاح وإرساله للطلاب.');
    setTimeout(() => setAsgSuccessMsg(''), 3000);
  };

  // فلترة الطلاب بناءً على البحث والصف
  const filteredStudentsRoster = students.filter(std => {
    const matchesClass = rosterClassFilter === 'all' || std.classId === rosterClassFilter;
    const matchesSearch = std.name.includes(rosterSearch) || std.personalNumber.includes(rosterSearch);
    return matchesClass && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-stone-100 p-4 sm:p-6 font-sans text-stone-800" dir="rtl">
      {/* شريط التنقل العلوي للنظام */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-stone-200 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-700 text-white rounded-2xl shadow-sm">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-black text-base text-emerald-950">نظام مقرأة سورة يس التعليمية</h1>
            <p className="text-xs text-stone-500">لوحة تحكم المعلم وإدارة التقييمات المقسمة</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-stone-50 p-1.5 rounded-2xl border border-stone-200">
          <button
            onClick={() => setActiveSection('students')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSection === 'students' ? 'bg-emerald-700 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            إدارة الطلاب والصفوف
          </button>
          <button
            onClick={() => setActiveSection('assignments')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSection === 'assignments' ? 'bg-emerald-700 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            إدارة الواجبات
          </button>
          <button
            onClick={() => setActiveSection('evaluations')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSection === 'evaluations' ? 'bg-emerald-700 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            نموذج التقييم الثنائي
          </button>
        </div>
      </div>

      {/* القسم الأول: إدارة الطلاب */}
      {activeSection === 'students' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* إضافة طالب */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs">
            <h3 className="font-bold text-sm text-stone-900 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-700" />
              <span>تسجيل طالب جديد</span>
            </h3>

            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">اختر الصف الدراسي:</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">اسم الطالب الرباعي:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: محمد أحمد..."
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">الرقم الشخصي (كلمة المرور):</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: 123456789"
                  value={newStudentPersonalId}
                  onChange={(e) => setNewStudentPersonalId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                حفظ وتسجيل الطالب
              </button>
            </form>
          </div>

          {/* قائمة الطلاب */}
          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs">
            <h3 className="font-bold text-sm text-stone-900 mb-4 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-emerald-700" />
              <span>سجل الطلاب ({students.length})</span>
            </h3>

            <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
              <table className="w-full text-right border-collapse text-xs">
                <thead className="sticky top-0 bg-stone-50">
                  <tr className="border-b border-stone-200 text-stone-600 font-bold">
                    <th className="py-2.5 px-3">اسم الطالب</th>
                    <th className="py-2.5 px-3">الرقم الشخصي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {students.map((std) => (
                    <tr key={std.id} className="hover:bg-stone-50/60">
                      <td className="py-2.5 px-3 font-bold text-stone-900">{std.name}</td>
                      <td className="py-2.5 px-3 font-mono text-stone-600">#{std.personalNumber}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* القسم الثاني: الواجبات */}
      {activeSection === 'assignments' && (
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs">
          <h3 className="font-bold text-sm text-stone-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-700" />
            <span>إدارة الواجبات القرآنية المسندة</span>
          </h3>
          <p className="text-xs text-stone-500 mb-4">الواجبات الحالية: {assignments.length}</p>
          {/* محتوى الواجبات المبسط */}
        </div>
      )}

      {/* القسم الثالث: نموذج التقييم الثنائي الجديد (المعلم والطالب) */}
      {activeSection === 'evaluations' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* واجهة تقييم المعلم (تظهر فيها الخانات المستقلة ومجموعها 10) */}
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
              <span className="p-2 bg-emerald-50 text-emerald-800 rounded-xl">
                <Award className="w-4 h-4" />
              </span>
              <h3 className="font-bold text-sm text-stone-900">لوحة تقييم المعلم (مقسمة من 10 درجات إجمالية)</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* خانة نطق الحروف من 5 */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                  1. نطق الحروف (من 5 درجات):
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.5"
                  value={letterPronunciationScore}
                  onChange={(e) => setLetterPronunciationScore(Math.min(5, Math.max(0, parseFloat(e.target.value) || 0)))}
                  className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
                <span className="text-[10px] text-stone-400 mt-1.5 block">مخارج الحروف والصفات</span>
              </div>

              {/* خانة التجويد من 5 */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                  2. التجويد والأحكام (من 5 درجات):
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.5"
                  value={tajweedScore}
                  onChange={(e) => setTajweedScore(Math.min(5, Math.max(0, parseFloat(e.target.value) || 0)))}
                  className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
                <span className="text-[10px] text-stone-400 mt-1.5 block">المدود، الغنن، أحكام النون والميم</span>
              </div>
            </div>

            {/* الدرجة الكلية التلقائية */}
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900">الدرجة الكلية المحسوبة للواجب:</span>
              <span className="text-sm font-black font-mono text-emerald-950 bg-white px-4 py-1.5 rounded-xl border border-emerald-300 shadow-xs">
                {totalScore} / 10
              </span>
            </div>
          </div>

          {/* واجهة عرض النتيجة للطالب */}
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
              <span className="p-2 bg-teal-50 text-teal-800 rounded-xl">
                <GraduationCap className="w-4 h-4" />
              </span>
              <h3 className="font-bold text-sm text-stone-900">ما يظهر في لوحة الطالب (نتيجة التلاوة)</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* عرض نطق الحروف */}
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-100 text-center">
                <span className="text-[11px] text-stone-600 font-medium block mb-1">نطق الحروف</span>
                <span className="text-sm font-black font-mono text-emerald-800">
                  {letterPronunciationScore} <span className="text-xs font-normal text-stone-400">/ 5</span>
                </span>
              </div>

              {/* عرض التجويد */}
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-100 text-center">
                <span className="text-[11px] text-stone-600 font-medium block mb-1">التجويد والأحكام</span>
                <span className="text-sm font-black font-mono text-emerald-800">
                  {tajweedScore} <span className="text-xs font-normal text-stone-400">/ 5</span>
                </span>
              </div>
            </div>

            {/* عرض الدرجة الكلية للطالب */}
            <div className="p-4 bg-emerald-900 text-white rounded-2xl flex items-center justify-between shadow-xs">
              <span className="text-xs font-bold">مجموع الدرجة الكلية</span>
              <span className="text-sm font-black font-mono bg-emerald-800 px-4 py-1.5 rounded-xl border border-emerald-700">
                {totalScore} / 10
              </span>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default QuranSystemDashboard;
