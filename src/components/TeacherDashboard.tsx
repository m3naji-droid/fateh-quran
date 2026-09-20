import React, { useState } from 'react';
import {  
  Award,  
  BookOpen,  
  CheckCircle2,  
  Users,  
  GraduationCap,  
  Trash2,  
  Pencil,  
  Search,  
  Plus,
  Eye,
  FileSpreadsheet,
  X
} from 'lucide-react';

// هيكل لتمثيل تقييم الكلمات والحروف
export interface LetterEvaluation {
  char: string;
  isVowel: boolean;
  status: 'correct' | 'mispronounced' | 'missing';
}

export interface WordEvaluation {
  word: string;
  status: 'correct' | 'mispronounced' | 'missing';
  letters?: LetterEvaluation[];
}

export interface SubmissionItem {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  assignmentId: string;
  assignmentTitle: string;
  pronunciationScore: number; // من 10
  tajweedScore: number;       // من 10
  totalScore: number;         // من 10
  submittedAt: string;
  wordEvaluations: WordEvaluation[];
}

export const TeacherDashboard = () => {
  // الحالة العامة للتنقل بين أقسام لوحة تحكم المعلم
  const [activeTab, setActiveTab] = useState<'roster' | 'assignments' | 'submissions'>('roster');

  // الصفوف الدراسية المطلوبة (ثاني إعدادي / 1 إلى 5) مع إمكانية إضافتها
  const [classes, setClasses] = useState([
    { id: 'c1', name: 'ثاني إعدادي / 1' },
    { id: 'c2', name: 'ثاني إعدادي / 2' },
    { id: 'c3', name: 'ثاني إعدادي / 3' },
    { id: 'c4', name: 'ثاني إعدادي / 4' },
    { id: 'c5', name: 'ثاني إعدادي / 5' }
  ]);

  const [newClassName, setNewClassName] = useState('');
  const [showAddClassModal, setShowAddClassModal] = useState(false);

  // قائمة الطلاب
  const [students, setStudents] = useState([
    { id: 's1', classId: 'c1', name: 'محمد أحمد عبدالله', personalNumber: '123456789' },
    { id: 's2', classId: 'c1', name: 'عبدالله خالد إبراهيم', personalNumber: '987654321' },
    { id: 's3', classId: 'c2', name: 'يوسف إبراهيم علي', personalNumber: '456789123' }
  ]);

  // قائمة الواجبات
  const [assignments, setAssignments] = useState([
    {  
      id: 'asg1',  
      classId: 'all', // أو معرف صف معين
      title: 'تلاوة سورة يس (الآيات 1 - 12)',  
      startAyah: 1,  
      endAyah: 12,  
      instructions: 'الالتزام بمخرج الحروف والمد الطبيعي.',  
      createdAt: '2026-06-01'  
    }
  ]);

  // استجابات الطلاب الوهمية للتجربة (بدون صوت)
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([
    {
      id: 'sub_1',
      studentId: 's1',
      studentName: 'محمد أحمد عبدالله',
      className: 'ثاني إعدادي / 1',
      assignmentId: 'asg1',
      assignmentTitle: 'تلاوة سورة يس (الآيات 1 - 12)',
      pronunciationScore: 9.0,
      tajweedScore: 8.5,
      totalScore: 8.8,
      submittedAt: '2026-06-02',
      wordEvaluations: [
        { word: 'يٰسٓ', status: 'correct', letters: [{ char: 'ي', isVowel: false, status: 'correct' }, { char: 'سٓ', isVowel: false, status: 'correct' }] },
        { word: 'وَٱلْقُرْءَانِ', status: 'correct', letters: [{ char: 'و', isVowel: false, status: 'correct' }, { char: 'ق', isVowel: false, status: 'correct' }] },
        { word: 'ٱلْحَكِيمِ', status: 'mispronounced', letters: [{ char: 'ح', isVowel: false, status: 'correct' }, { char: 'ك', isVowel: false, status: 'mispronounced' }] }
      ]
    }
  ]);

  // حالات إضافة طالب جديد (فردي أو جماعي)
  const [newName, setNewName] = useState('');
  const [newPersonalId, setNewPersonalId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || '');
  const [bulkStudentsText, setBulkStudentsText] = useState('');
  const [addMode, setAddMode] = useState<'single' | 'bulk'>('single');

  // حالات إنشاء واجب جديد
  const [asgTitle, setAsgTitle] = useState('تلاوة سورة يس');
  const [asgClassId, setAsgClassId] = useState('all');
  const [asgStartAyah, setAsgStartAyah] = useState(1);
  const [asgEndAyah, setAsgEndAyah] = useState(12);
  const [asgInstructions, setAsgInstructions] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // حالات تصفية الاستجابات حسب الواجب المختار
  const [selectedAssignmentFilter, setSelectedAssignmentFilter] = useState<string>('all');
  const [selectedSubmissionDetails, setSelectedSubmissionDetails] = useState<SubmissionItem | null>(null);

  // حالات البحث والتصفية للطلاب
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');

  // إضافة صف جديد
  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    const newCls = {
      id: 'c_' + Date.now(),
      name: newClassName.trim()
    };
    setClasses([...classes, newCls]);
    setNewClassName('');
    setShowAddClassModal(false);
  };

  // إضافة طالب فردي أو جماعي
  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (addMode === 'single') {
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
    } else {
      // إضافة جماعية (كل سطر: الاسم,الرقم الشخصي)
      const lines = bulkStudentsText.split('\n').filter(l => l.trim());
      const added = lines.map((line, idx) => {
        const parts = line.split(/[,،\t]/);
        return {
          id: 's_' + Date.now() + '_' + idx,
          classId: selectedClassId,
          name: parts[0]?.trim() || 'طالب جديد',
          personalNumber: parts[1]?.trim() || ('1000' + idx)
        };
      });
      setStudents([...students, ...added]);
      setBulkStudentsText('');
    }
  };

  // إنشاء واجب جديد وإضافته للقائمة المنسدلة فوراً
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
    setSuccessMsg('تم إنشاء وإسناد الواجب بنجاح وإضافته لقائمة الواجبات.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // تصفية الطلاب
  const filteredStudents = students.filter(std => {
    const matchesClass = classFilter === 'all' || std.classId === classFilter;
    const matchesSearch = std.name.includes(searchTerm) || std.personalNumber.includes(searchTerm);
    return matchesClass && matchesSearch;
  });

  // تصفية الاستجابات حسب الواجب المختار في القائمة المنسدلة
  const filteredSubmissions = submissions.filter(sub => {
    if (selectedAssignmentFilter === 'all') return true;
    return sub.assignmentId === selectedAssignmentFilter;
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
            <p className="text-xs text-stone-500">إدارة الصفوف، الطلاب، الواجبات، ومتابعة استجابات التلاوة</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-stone-50 p-1.5 rounded-2xl border border-stone-200 flex-wrap justify-center">
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
            إدارة الواجبات وإسنادها
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'submissions' ? 'bg-emerald-700 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            استجابات الطلاب والدرجات
          </button>
        </div>
      </div>

      {/* التبويب الأول: إدارة الطلاب والصفوف (من ثاني إعدادي / 1 إلى 5 + إضافة صف) */}
      {activeTab === 'roster' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* قسم إضافة طالب وعرض الصفوف */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-700" />
                <span>إدارة الطلاب والصفوف الدراسية</span>
              </h3>
              <button
                onClick={() => setShowAddClassModal(true)}
                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> إضافة صف جديد
              </button>
            </div>

            {/* نموذج إضافة طالب فردي أو جماعي */}
            <form onSubmit={handleAddStudent} className="space-y-4 pt-2 border-t border-stone-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700">تسجيل طالب جديد:</label>
                <div className="flex gap-1 bg-stone-100 p-1 rounded-xl text-[11px]">
                  <button
                    type="button"
                    onClick={() => setAddMode('single')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${addMode === 'single' ? 'bg-white text-emerald-800 shadow-xs' : 'text-stone-600'}`}
                  >
                    فردي
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddMode('bulk')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${addMode === 'bulk' ? 'bg-white text-emerald-800 shadow-xs' : 'text-stone-600'}`}
                  >
                    جماعي (إكسل/نص)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">اختر الصف:</label>
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

              {addMode === 'single' ? (
                <>
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
                    <label className="text-xs font-semibold text-stone-700 block mb-1">الرقم الشخصي (كلمة المرور):</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: 123456789"
                      value={newPersonalId}
                      onChange={(e) => setNewPersonalId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">الصق قائمة الطلاب (كل سطر: الاسم, الرقم الشخصي):</label>
                  <textarea
                    rows={4}
                    value={bulkStudentsText}
                    onChange={(e) => setBulkStudentsText(e.target.value)}
                    placeholder="محمد أحمد, 123456789&#10;علي خالد, 987654321"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono focus:outline-none resize-none"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                {addMode === 'single' ? 'حفظ وتسجيل الطالب' : 'استيراد وإضافة الطلاب دفعة واحدة'}
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

            <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
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

      {/* التبويب الثاني: إدارة الواجبات وإسنادها */}
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
                <label className="text-xs font-semibold text-stone-700 block mb-1">إسناد إلى:</label>
                <select
                  value={asgClassId}
                  onChange={(e) => setAsgClassId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none"
                >
                  <option value="all">جميع الصفوف دفعة واحدة</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>صف: {c.name}</option>
                  ))}
                </select>
              </div>

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
                <label className="text-xs font-semibold text-stone-700 block mb-1">تعليمات المعلم:</label>
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
              {assignments.map(asg => {
                const targetCls = classes.find(c => c.id === asg.classId);
                return (
                  <div key={asg.id} className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs text-stone-900">{asg.title}</h4>
                        <span className="text-[10px] bg-stone-200 text-stone-700 px-2 py-0.5 rounded-md font-semibold">
                          {targetCls ? targetCls.name : 'جميع الصفوف'}
                        </span>
                      </div>
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
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* التبويب الثالث: استجابات الطلاب والدرجات (مع قائمة منسدلة ديناميكية للواجبات وعرض تفصيلي بدون صوت) */}
      {activeTab === 'submissions' && (
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 border-b border-stone-100">
            <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-700" />
              <span>استجابات وتلاوات الطلاب المرسلة للتقييم</span>
            </h3>

            {/* القائمة المنسدلة للواجبات (ديناميكية تتحدث فور إضافة واجب) */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-xs font-semibold text-stone-600">اختر الواجب:</label>
              <select
                value={selectedAssignmentFilter}
                onChange={(e) => setSelectedAssignmentFilter(e.target.value)}
                className="px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              >
                <option value="all">كل الواجبات المسندة</option>
                {assignments.map(a => (
                  <option key={a.id} value={a.id}>{a.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* جدول الاستجابات */}
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead className="bg-stone-50">
                <tr className="border-b border-stone-200 text-stone-600 font-bold">
                  <th className="py-3 px-3">اسم الطالب</th>
                  <th className="py-3 px-3">الصف الدراسي</th>
                  <th className="py-3 px-3">عنوان الواجب</th>
                  <th className="py-3 px-3 text-center">نطق الحروف (من 10)</th>
                  <th className="py-3 px-3 text-center">التجويد (من 10)</th>
                  <th className="py-3 px-3 text-center">المجموع العام</th>
                  <th className="py-3 px-3 text-center">التفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-stone-400 text-xs">
                      لا توجد استجابات مسجلة لهذا الواجب حالياً.
                    </td>
                  </tr>
                ) : (
                  filteredSubmissions.map(sub => (
                    <tr key={sub.id} className="hover:bg-stone-50/60">
                      <td className="py-3 px-3 font-bold text-stone-900">{sub.studentName}</td>
                      <td className="py-3 px-3 text-stone-600">{sub.className}</td>
                      <td className="py-3 px-3 text-stone-700">{sub.assignmentTitle}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-stone-700">{sub.pronunciationScore}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-stone-700">{sub.tajweedScore}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-lg font-mono font-black">
                          {sub.totalScore} / 10
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setSelectedSubmissionDetails(sub)}
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 mx-auto transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> عرض التقرير
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* نافذة تفاصيل استجابة الطالب (بدون تسجيل صوتي، مع تحليل الحروف والدرجات) */}
      {selectedSubmissionDetails && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-stone-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-sm text-stone-900">
                تقرير تلاوة الطالب: {selectedSubmissionDetails.studentName}
              </h3>
              <button
                onClick={() => setSelectedSubmissionDetails(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
                <span className="text-[10px] text-stone-500 block">نطق الحروف</span>
                <span className="text-sm font-black font-mono text-emerald-900">{selectedSubmissionDetails.pronunciationScore} / 10</span>
              </div>
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
                <span className="text-[10px] text-stone-500 block">أحكام التجويد</span>
                <span className="text-sm font-black font-mono text-emerald-900">{selectedSubmissionDetails.tajweedScore} / 10</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                <span className="text-[10px] text-emerald-700 block font-bold">المجموع العام</span>
                <span className="text-sm font-black font-mono text-emerald-950">{selectedSubmissionDetails.totalScore} / 10</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold text-stone-800">تحليل الكلمات والحروف المقروءة:</h4>
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {selectedSubmissionDetails.wordEvaluations.map((w, idx) => (
                    <span
                      key={idx}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                        w.status === 'correct'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : 'bg-amber-50 border-amber-200 text-amber-900'
                      }`}
                    >
                      {w.word}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-stone-500 pt-1">
                  ملاحظة: تم تقييم أداء الطالب بدقة حرفاً بحرف بناءً على محرك المقرأة الآلي (دون تسجيل صوتي).
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedSubmissionDetails(null)}
              className="w-full py-2.5 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-bold transition-all"
            >
              إغلاق التقارير
            </button>
          </div>
        </div>
      )}

      {/* نافذة منبثقة لإضافة صف دراسي جديد */}
      {showAddClassModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl border border-stone-200 space-y-4">
            <h3 className="font-bold text-sm text-stone-900">إضافة صف دراسي جديد</h3>
            <form onSubmit={handleAddClass} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">اسم الصف (مثال: ثاني إعدادي / 6):</label>
                <input
                  type="text"
                  required
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="أدخل اسم الصف..."
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddClassModal(false)}
                  className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold"
                >
                  حفظ الصف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
