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
import { ClassRoom, Student, Assignment, Submission } from '../types';
import {
  saveClass,
  updateClass,
  deleteClass,
  saveStudent,
  updateStudent,
  saveBulkStudents,
  deleteStudent,
  saveAssignment,
  deleteAssignment
} from '../utils/storage';

interface TeacherDashboardProps {
  classes: ClassRoom[];
  students: Student[];
  assignments: Assignment[];
  submissions: Submission[];
  onDataRefresh: () => void;
  activeSection: 'submissions' | 'classes' | 'assignments';
  onSectionChange: (section: 'submissions' | 'classes' | 'assignments') => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  classes,
  students,
  assignments,
  submissions,
  onDataRefresh,
  activeSection,
  onSectionChange,
}) => {
  // حالات إضافة صف جديد
  const [newClassName, setNewClassName] = useState('');
  const [showAddClassModal, setShowAddClassModal] = useState(false);

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

  // حالات تصفية الاستجابات والبحث
  const [selectedAssignmentFilter, setSelectedAssignmentFilter] = useState<string>('all');
  const [selectedSubmissionDetails, setSelectedSubmissionDetails] = useState<Submission | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');

  // إضافة صف جديد وحفظه سحابياً ومحلياً
  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    await saveClass(newClassName.trim());
    setNewClassName('');
    setShowAddClassModal(false);
    onDataRefresh();
  };

  // إضافة طالب فردي أو جماعي
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId) {
      alert('الرجاء اختيار الصف أولاً');
      return;
    }

    if (addMode === 'single') {
      if (!newName || !newPersonalId) return;
      await saveStudent({
        name: newName.trim(),
        personalNumber: newPersonalId.trim(),
        classId: selectedClassId,
      });
      setNewName('');
      setNewPersonalId('');
    } else {
      const lines = bulkStudentsText.split('\n').filter(l => l.trim());
      const studentsArray = lines.map((line) => {
        const parts = line.split(/[,،\t]/);
        return {
          name: parts[0]?.trim() || 'طالب جديد',
          personalNumber: parts[1]?.trim() || ('1000' + Math.floor(Math.random() * 1000)),
          classId: selectedClassId,
        };
      });
      await saveBulkStudents(studentsArray);
      setBulkStudentsText('');
    }
    onDataRefresh();
  };

  // إنشاء واجب جديد
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveAssignment({
      classId: asgClassId,
      title: asgTitle,
      startAyah: asgStartAyah,
      endAyah: asgEndAyah,
      instructions: asgInstructions,
    });
    setSuccessMsg('تم إنشاء وإسناد الواجب بنجاح وإضافته لقائمة الواجبات.');
    setTimeout(() => setSuccessMsg(''), 3000);
    onDataRefresh();
  };

  // تصفية الطلاب
  const filteredStudents = students.filter(std => {
    const matchesClass = classFilter === 'all' || std.classId === classFilter;
    const matchesSearch = std.name.includes(searchTerm) || std.personalNumber.includes(searchTerm);
    return matchesClass && matchesSearch;
  });

  // تصفية الاستجابات
  const filteredSubmissions = submissions.filter(sub => {
    if (selectedAssignmentFilter === 'all') return true;
    return sub.assignmentId === selectedAssignmentFilter;
  });

  return (
    <div className="space-y-6">
      {/* التبويبات الداخلية للمعلم */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-stone-200 shadow-xs flex-wrap">
        <button
          onClick={() => onSectionChange('classes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSection === 'classes' ? 'bg-emerald-700 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          إدارة الطلاب والصفوف
        </button>
        <button
          onClick={() => onSectionChange('assignments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSection === 'assignments' ? 'bg-emerald-700 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          إدارة الواجبات وإسنادها
        </button>
        <button
          onClick={() => onSectionChange('submissions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSection === 'submissions' ? 'bg-emerald-700 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          استجابات الطلاب والدرجات
        </button>
      </div>

      {/* قسم إدارة الطلاب والصفوف */}
      {activeSection === 'classes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
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
                    جماعي (نصي)
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

          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-emerald-700" />
                <span>سجل الطلاب ({filteredStudents.length})</span>
              </h3>

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
                    <th className="py-2.5 px-3 text-center">الإجراء</th>
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
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={async () => {
                              if (window.confirm(`هل أنت متأكد من حذف الطالب ${std.name}؟`)) {
                                await deleteStudent(std.id);
                                onDataRefresh();
                              }
                            }}
                            className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="حذف الطالب"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* قسم إدارة الواجبات */}
      {activeSection === 'assignments' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
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
                        النطاق: من آية {asg.startAyah} إلى آية {asg.endAyah}
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        await deleteAssignment(asg.id);
                        onDataRefresh();
                      }}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* قسم الاستجابات والدرجات */}
      {activeSection === 'submissions' && (
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 border-b border-stone-100">
            <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-700" />
              <span>استجابات وتلاوات الطلاب المرسلة للتقييم</span>
            </h3>

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

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead className="bg-stone-50">
                <tr className="border-b border-stone-200 text-stone-600 font-bold">
                  <th className="py-3 px-3">اسم الطالب</th>
                  <th className="py-3 px-3">الصف الدراسي</th>
                  <th className="py-3 px-3">عنوان الواجب</th>
                  <th className="py-3 px-3 text-center">التقييم الآلي</th>
                  <th className="py-3 px-3 text-center">التجويد</th>
                  <th className="py-3 px-3 text-center">درجة المعلم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-stone-400 text-xs">
                      لا توجد استجابات مسجلة لهذا الواجب حالياً.
                    </td>
                  </tr>
                ) : (
                  filteredSubmissions.map(sub => (
                    <tr key={sub.id} className="hover:bg-stone-50/60">
                      <td className="py-3 px-3 font-bold text-stone-900">{sub.studentName}</td>
                      <td className="py-3 px-3 text-stone-600">{sub.className}</td>
                      <td className="py-3 px-3 text-stone-700">{sub.assignmentTitle}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-stone-700">{sub.aiScore} / 10</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-stone-700">{sub.tajweedScore ?? sub.aiScore} / 10</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-emerald-800">
                        {sub.teacherGrade !== null ? `${sub.teacherGrade} / 10` : 'قيد التدقيق'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* نافذة إضافة صف دراسي جديد */}
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
                  className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold cursor-pointer"
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
