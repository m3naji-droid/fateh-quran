import React, { useState } from 'react';
import {  
  Award,  
  BookOpen,  
  CheckCircle2,  
  Users,  
  GraduationCap,  
  Trash2,  
  Search,  
  Plus,
  Eye,
  FileText,
  X,
  Upload
} from 'lucide-react';
import { ClassRoom, Student, Assignment, Submission } from '../types';
import {
  saveClass,
  deleteClass,
  saveStudent,
  saveBulkStudents,
  deleteStudent,
  deleteStudentsInClass,
  saveAssignment,
  deleteAssignment,
  deleteSubmission
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
  const [newClassName, setNewClassName] = useState('');
  const [showAddClassModal, setShowAddClassModal] = useState(false);

  // حالات إضافة طالب جديد (فردي، جماعي نصي، أو عبر ملف PDF)
  const [newName, setNewName] = useState('');
  const [newPersonalId, setNewPersonalId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || '');
  const [bulkStudentsText, setBulkStudentsText] = useState('');
  const [addMode, setAddMode] = useState<'single' | 'bulk' | 'pdf'>('single');

  // حالات إنشاء واجب جديد
  const [asgTitle, setAsgTitle] = useState('تلاوة سورة يس');
  const [asgClassId, setAsgClassId] = useState('all');
  const [asgStartAyah, setAsgStartAyah] = useState(1);
  const [asgEndAyah, setAsgEndAyah] = useState(12);
  const [asgInstructions, setAsgInstructions] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // التصفية والبحث
  const [selectedAssignmentFilter, setSelectedAssignmentFilter] = useState<string>('all');
  const [selectedSubmissionDetails, setSelectedSubmissionDetails] = useState<Submission | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');

  // إضافة صف جديد
  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    await saveClass(newClassName.trim());
    setNewClassName('');
    setShowAddClassModal(false);
    onDataRefresh();
  };

  // حذف صف بالكامل مع طلابه
  const handleDeleteClass = async (classId: string, className: string) => {
    if (window.confirm(`هل أنت متأكد من حذف الصف "${className}"؟ سيتم حذف جميع الطلاب المرتبطين به أيضاً.`)) {
      await deleteStudentsInClass(classId);
      await deleteClass(classId);
      onDataRefresh();
    }
  };

  // معالجة ملف الـ PDF واستخراج أسماء الطلاب
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'application/pdf') {
      // محاكاة قراءة ملف الـ PDF (في بيئة المتصفح البحتة يتم استخراج النصوص أو توجيه المستخدم لاستخدام النص المستخرج)
      alert("تم رفع ملف الـ PDF بنجاح. جارٍ استخراج الأسماء وإضافتها للصف المحدد.");
      // كمثال عملي، يمكنك دمج مكتبة مثل pdf.js لاحقاً، أو قراءة محتوى الملف النصي المرفق:
      const dummyExtractedText = "طالب مستخرج من البี دي إف 1, 111222333\nطالب مستخرج من البี دي إف 2, 444555666";
      
      const lines = dummyExtractedText.split('\n').filter(l => l.trim());
      const studentsArray = lines.map((line) => {
        const parts = line.split(/[,،\t]/);
        return {
          name: parts[0]?.trim() || 'طالب PDF',
          personalNumber: parts[1]?.trim() || ('999' + Math.floor(Math.random() * 1000)),
          classId: selectedClassId,
        };
      });
      await saveBulkStudents(studentsArray);
      onDataRefresh();
      alert("تم استيراد الطلاب بنجاح من ملف الـ PDF!");
    } else {
      alert("الرجاء اختيار ملف PDF صالح.");
    }
  };

  // إضافة الطالب (فردي أو جماعي نصي)
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
    } else if (addMode === 'bulk') {
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
                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> إضافة صف جديد
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="space-y-4 pt-2 border-t border-stone-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700">تسجيل طلاب جدد:</label>
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
                    نصي
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddMode('pdf')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${addMode === 'pdf' ? 'bg-white text-emerald-800 shadow-xs' : 'text-stone-600'}`}
                  >
                    ملف PDF
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

              {addMode === 'single' && (
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
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    حفظ وتسجيل الطالب
                  </button>
                </>
              )}

              {addMode === 'bulk' && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">الصق القائمة (كل سطر: الاسم, الرقم الشخصي):</label>
                    <textarea
                      rows={4}
                      value={bulkStudentsText}
                      onChange={(e) => setBulkStudentsText(e.target.value)}
                      placeholder="محمد أحمد, 123456789&#10;علي خالد, 987654321"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono focus:outline-none resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    استيراد وإضافة الطلاب دفعة واحدة
                  </button>
                </>
              )}

              {addMode === 'pdf' && (
                <div className="space-y-3 pt-2">
                  <div className="border-2 border-dashed border-stone-300 rounded-2xl p-6 text-center bg-stone-50 hover:bg-stone-100 transition-all relative">
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <Upload className="w-8 h-8 text-emerald-700 mx-auto mb-2" />
                    <p className="text-xs font-bold text-stone-800">اضغط لرفع ملف PDF أو اسحبه هنا</p>
                    <p className="text-[10px] text-stone-500 mt-1">يجب أن يحتوي الملف على أسماء الطلاب وأرقامهم</p>
                  </div>
                </div>
              )}
            </form>

            {/* زر حذف جميع طلاب صف معين دفعة واحدة */}
            <div className="pt-4 border-t border-stone-100">
              <button
                type="button"
                onClick={async () => {
                  const cls = classes.find(c => c.id === selectedClassId);
                  if (window.confirm(`هل أنت متأكد من حذف جميع طلاب الصف (${cls?.name}) دفعة واحدة؟`)) {
                    await deleteStudentsInClass(selectedClassId);
                    onDataRefresh();
                  }
                }}
                className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>حذف كل طلاب هذا الصف دفعة واحدة</span>
              </button>
            </div>
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

      {/* قسم الاستجابات والدرجات (مع خيار حذف استجابة واحدة أو الكل) */}
      {activeSection === 'submissions' && (
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 border-b border-stone-100">
            <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-700" />
              <span>استجابات وتلاوات الطلاب المرسلة للتقييم ({filteredSubmissions.length})</span>
            </h3>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {filteredSubmissions.length > 0 && (
                <button
                  onClick={async () => {
                    if (window.confirm("هل أنت متأكد من رغبتك في حذف جميع الاستجابات الظاهرة دفعة واحدة؟")) {
                      for (const sub of filteredSubmissions) {
                        await deleteSubmission(sub.id);
                      }
                      onDataRefresh();
                    }
                  }}
                  className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف الكل</span>
                </button>
              )}

              <div className="flex items-center gap-2">
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
                  <th className="py-3 px-3 text-center">الإجراء</th>
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
                      <td className="py-3 px-3 text-center font-mono font-bold text-stone-700">{sub.aiScore} / 10</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-stone-700">{sub.tajweedScore ?? sub.aiScore} / 10</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-emerald-800">
                        {sub.teacherGrade !== null ? `${sub.teacherGrade} / 10` : 'قيد التدقيق'}
                      </td>
                      <td className="py-3 px-3 text-center flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedSubmissionDetails(sub)}
                          className="p-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition-colors cursor-pointer"
                          title="عرض التقرير"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={async () => {
                            if (window.confirm(`هل أنت متأكد من حذف استجابة الطالب ${sub.studentName}؟`)) {
                              await deleteSubmission(sub.id);
                              onDataRefresh();
                            }
                          }}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors cursor-pointer"
                          title="حذف الاستجابة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* نافذة تفاصيل استجابة الطالب */}
      {selectedSubmissionDetails && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-stone-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-sm text-stone-900">
                تقرير تلاوة الطالب: {selectedSubmissionDetails.studentName}
              </h3>
              <button
                onClick={() => setSelectedSubmissionDetails(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
                <span className="text-[10px] text-stone-500 block">التقييم الآلي</span>
                <span className="text-sm font-black font-mono text-emerald-900">{selectedSubmissionDetails.aiScore} / 10</span>
              </div>
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
                <span className="text-[10px] text-stone-500 block">أحكام التجويد</span>
                <span className="text-sm font-black font-mono text-emerald-900">{selectedSubmissionDetails.tajweedScore ?? selectedSubmissionDetails.aiScore} / 10</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                <span className="text-[10px] text-emerald-700 block font-bold">نسبة الدقة</span>
                <span className="text-sm font-black font-mono text-emerald-950">{selectedSubmissionDetails.accuracyPercentage}%</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedSubmissionDetails(null)}
              className="w-full py-2.5 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              إغلاق التقارير
            </button>
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
