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

export const TeacherDashboard = () => {
  // الحالة العامة للتنقل بين أقسام لوحة تحكم المعلم
  const [activeTab, setActiveTab] = useState<'roster' | 'assignments' | 'submissions'>('roster');

  // بيانات وهمية لصفوف الطلاب والواجبات
  const [classes] = useState([
    { id: 'c1', name: 'صف أول متوسط (أ)' },
    { id: 'c2', name: 'صف ثاني متوسط (ب)' }
  ]);

  const [students, setStudents] = useState([
    { id: 's1', classId: 'c1', name: 'محمد أحمد عبدالله', personalNumber: '123456789' },
    { id: 's2', classId: 'c1', name: 'عبدالله خالد إبراهيم', personalNumber: '987654321' },
    { id: 's3', classId: 'c2', name: 'يوسف إبراهيم علي', personalNumber: '456789123' }
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

  // حالات إضافة طالب جديد
  const [newName, setNewName] = useState('');
  const [newPersonalId, setNewPersonalId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || '');

  // حالات إنشاء واجب جديد
  const [asgTitle, setAsgTitle] = useState('تلاوة سورة يس');
  const [asgClassId, setAsgClassId] = useState('all');
  const [asgStartAyah, setAsgStartAyah] = useState(1);
  const [asgEndAyah, setAsgEndAyah] = useState(12);
  const [asgInstructions, setAsgInstructions] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // حالات نظام التقييم المعدل (نطق الحروف من 5، التجويد من 5، والمجموع التلقائي من 10)
  const [pronunciationScore, setPronunciationScore] = useState<number>(4.0);
  const [tajweedScore, setTajweedScore] = useState<number>(4.5);
  const totalScore = Number(((Number(pronunciationScore) || 0) + (Number(tajweedScore) || 0)).toFixed(1));

  // حالات البحث والتصفية للطلاب
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');

  // إضافة طالب
  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPersonalId) return;
    const newStudent = {
      id: 's_' + Date.now(),
      classId: selectedClassId,
      name: newName,
      personalNumber: newPersonalId
    };
    setStudents([...students, newStudent]);
    setNewName('');
    setNewPersonalId('');
  };

  // إنشاء واجب
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
    setSuccessMsg('تم إنشاء وإسناد الواجب بنجاح للطلاب.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // تصفية الطلاب
  const filteredStudents = students.filter(std => {
    const matchesClass = classFilter === 'all' || std.classId === classFilter;
    const matchesSearch = std.name.includes(searchTerm) || std.personalNumber.includes(searchTerm);
    return matchesClass && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-stone-100 p-4 sm:p-6 font-sans text-stone-800" dir="rtl">
      {/* شريط العنوان والتبويبات العلوي */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-stone-200 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-700 text-white rounded-2xl shadow-sm">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-black text-base text-emerald-950">لوحة تحكم المعلم - مقرأة سورة يس</h1>
            <p className="text-xs text-stone-500">إدارة الطلاب، الواجبات، ومتابعة تلاوات الفصل</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-stone-50 p-1.5 rounded-2xl border border-stone-200">
          <button
            onClick={() => setActiveTab('roster')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'roster' ? 'bg-emerald-700 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            إدارة الطلاب والصفوف
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'assignments' ? 'bg-emerald-700 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            إدارة الواجبات
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'submissions' ? 'bg-emerald-700 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            متابعة تسجيلات الطلاب
          </button>
        </div>
      </div>

      {/* التبويب الأول: إدارة الطلاب والصفوف */}
      {activeTab === 'roster' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* إضافة طالب */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs">
            <h3 className="font-bold text-sm text-stone-900 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-700" />
              <span>تسجيل طالب جديد في المقرأة</span>
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
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">الرقم الشخصي (كلمة المرور للدخول):</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: 123456789"
                  value={newPersonalId}
                  onChange={(e) => setNewPersonalId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                حفظ وتسجيل الطالب
              </button>
            </form>
          </div>

          {/* جدول واستعراض الطلاب */}
          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-emerald-700" />
                <span>سجل الطلاب ({filteredStudents.length})</span>
              </h3>

              {/* شريط البحث والتصفية */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-48">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute right-3 top-3" />
                  <input
                    type="text"
                    placeholder="بحث بالاسم أو الرقم..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pr-8 pl-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none"
                >
                  <option value="all">كل الصفوف</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
              <table className="w-full text-right border-collapse text-xs">
                <thead className="sticky top-0 bg-stone-50">
                  <tr className="border-b border-stone-200 text-stone-600 font-bold">
                    <th className="py-2.5 px-3">اسم الطالب</th>
                    <th className="py-2.5 px-3">الصف الدراسي</th>
                    <th className="py-2.5 px-3">الرقم الشخصي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredStudents.map((std) => {
                    const cls = classes.find(c => c.id === std.classId);
                    return (
                      <tr key={std.id} className="hover:bg-stone-50/60">
                        <td className="py-2.5 px-3 font-bold text-stone-900">{std.name}</td>
                        <td className="py-2.5 px-3 text-stone-600">{cls?.name || 'غير محدد'}</td>
                        <td className="py-2.5 px-3 font-mono text-stone-600">#{std.personalNumber}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* التبويب الثاني: إدارة الواجبات */}
      {activeTab === 'assignments' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* نموذج إنشاء واجب */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs">
            <h3 className="font-bold text-sm text-stone-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-700" />
              <span>إسناد واجب قرآني جديد</span>
            </h3>

            {successMsg && (
              <div className="p-3 mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">عنوان الواجب:</label>
                <input
                  type="text"
                  required
                  value={asgTitle}
                  onChange={(e) => setAsgTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">من الآية:</label>
                  <input
                    type="number"
                    min="1"
                    max="83"
                    value={asgStartAyah}
                    onChange={(e) => setAsgStartAyah(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">إلى الآية:</label>
                  <input
                    type="number"
                    min="1"
                    max="83"
                    value={asgEndAyah}
                    onChange={(e) => setAsgEndAyah(parseInt(e.target.value) || 12)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">تعليمات وتوجيهات المعلم:</label>
                <textarea
                  rows={3}
                  value={asgInstructions}
                  onChange={(e) => setAsgInstructions(e.target.value)}
                  placeholder="مثال: التركيز على أحكام المد والغنن..."
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                نشر وإرسال الواجب للطلاب
              </button>
            </form>
          </div>

          {/* قائمة الواجبات الحالية */}
          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-700" />
              <span>الواجبات المسندة حالياً ({assignments.length})</span>
            </h3>

            <div className="space-y-3">
              {assignments.map(asg => (
                <div key={asg.id} className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-stone-900">{asg.title}</h4>
                    <p className="text-[11px] text-stone-500 mt-1">
                      النطاق: من آية {asg.startAyah} إلى آية {asg.endAyah} • تاريخ النشر: {asg.createdAt}
                    </p>
                    {asg.instructions && (
                      <p className="text-[11px] text-emerald-800 mt-1 font-medium">التعليمات: {asg.instructions}</p>
                    )}
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold">
                    نشط
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* التبويب الثالث: متابعة تسجيلات الطلاب */}
      {activeTab === 'submissions' && (
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-700" />
              <span>سجل تلاوات الطلاب المرسلة للتقييم</span>
            </h3>
            <span className="text-xs text-stone-500">متابعة الأداء الصوتي والدرجات</span>
          </div>

          {/* معاينة نموذج التقييم الجديد (خانة من 5 + خانة من 5 = المجموع من 10) */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-4 max-w-md mx-auto">
            <h4 className="font-bold text-xs text-stone-900 text-center">نموذج تقييم المعلم (محدث)</h4>
            
            <div className="flex items-center justify-center gap-2 bg-white p-3 rounded-xl border border-stone-200 shadow-xs">
              {/* الخانة الأولى: نطق الحروف من 5 */}
              <div className="text-center">
                <span className="text-[10px] text-stone-600 block mb-1 font-semibold">نطق الحروف (5)</span>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.5"
                  value={pronunciationScore}
                  onChange={(e) => setPronunciationScore(Math.min(5, Math.max(0, parseFloat(e.target.value) || 0)))}
                  className="w-16 px-2 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-mono font-bold text-center focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>

              <span className="text-stone-400 font-bold text-base mt-4">+</span>

              {/* الخانة الثانية: أحكام التجويد من 5 */}
              <div className="text-center">
                <span className="text-[10px] text-stone-600 block mb-1 font-semibold">التجويد (5)</span>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.5"
                  value={tajweedScore}
                  onChange={(e) => setTajweedScore(Math.min(5, Math.max(0, parseFloat(e.target.value) || 0)))}
                  className="w-16 px-2 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-mono font-bold text-center focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>

              <span className="text-stone-400 font-bold text-base mt-4">=</span>

              {/* الخانة الثالثة: المجموع الكلي من 10 */}
              <div className="text-center bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                <span className="text-[10px] text-emerald-800 block mb-1 font-bold">المجموع</span>
                <span className="text-xs font-black font-mono text-emerald-950">
                  {totalScore} <span className="text-[9px]">/10</span>
                </span>
              </div>
            </div>
          </div>

          <div className="text-center py-6 bg-stone-50 rounded-2xl border border-dashed border-stone-200 text-stone-500 text-xs mt-4">
            لا توجد تسجيلات معلقة جديدة حالياً. ستظهر تلاوات الطلاب هنا بمجرد إرسالهم للواجبات.
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
