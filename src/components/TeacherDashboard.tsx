import React, { useState, useRef } from 'react';
import {
  Users,
  BookOpen,
  Upload,
  FileSpreadsheet,
  Download,
  Plus,
  Trash2,
  CheckCircle2,
  Save,
  RotateCcw,
  Search,
  Filter,
  Eye,
  AlertCircle,
  Pencil,
  X,
  Check,
  UserX,
  GraduationCap,
  Sparkles
} from 'lucide-react';
import { Assignment, ClassRoom, Student, Submission } from '../types';
import { AudioPlayer } from './AudioPlayer';
import { EvaluationModal } from './EvaluationModal';
import { getVerseRangeText } from '../data/surahYasin';
import {
  saveClass,
  updateClass,
  deleteClass,
  saveStudent,
  updateStudent,
  deleteStudent,
  deleteStudentsInClass,
  deleteAllStudents,
  saveBulkStudents,
  saveAssignment,
  updateAssignment,
  deleteAssignment,
  deleteAllAssignments,
  updateSubmissionTeacherFeedback,
  deleteSubmission
} from '../utils/storage';
import {
  parseStudentsFile,
  exportSubmissionsToExcel,
  downloadSampleExcelTemplate,
  exportStudentsListToExcel
} from '../utils/excelHelper';

interface TeacherDashboardProps {
  classes: ClassRoom[];
  students: Student[];
  assignments: Assignment[];
  submissions: Submission[];
  onDataRefresh: () => void;
  activeSection: 'submissions' | 'classes' | 'assignments';
  onSectionChange: (sec: 'submissions' | 'classes' | 'assignments') => void;
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
  // Filter states for submissions
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [searchStudentText, setSearchStudentText] = useState<string>('');

  // Editing feedback state for submissions
  const [editingFeedback, setEditingFeedback] = useState<{
    [submissionId: string]: { grade: string; notes: string; savedMsg?: boolean };
  }>({});

  // Inspecting submission modal
  const [inspectSubmission, setInspectSubmission] = useState<Submission | null>(null);

  // New Class Form State
  const [newClassName, setNewClassName] = useState('');

  // Single Student Form State
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentPersonalId, setNewStudentPersonalId] = useState('');
  const [newStudentClassId, setNewStudentClassId] = useState(classes[0]?.id || '');

  // Bulk Upload State
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [bulkClassId, setBulkClassId] = useState(classes[0]?.id || '');
  const [bulkUploadMsg, setBulkUploadMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // New Assignment Form State
  const [asgTitle, setAsgTitle] = useState('واجب التلاوة الأسبوعي - سورة يس');
  const [asgClassId, setAsgClassId] = useState('all');
  const [asgStartAyah, setAsgStartAyah] = useState<number>(1);
  const [asgEndAyah, setAsgEndAyah] = useState<number>(12);
  const [asgInstructions, setAsgInstructions] = useState('قراءة الآيات المحددة بترتيل متأنٍ ومراعاة أحكام التجويد.');
  const [asgSuccessMsg, setAsgSuccessMsg] = useState('');

  // Filtered submissions
  const filteredSubmissions = submissions.filter((sub) => {
    const matchClass = selectedClassFilter === 'all' || sub.classId === selectedClassFilter;
    const matchSearch =
      !searchStudentText.trim() ||
      sub.studentName.includes(searchStudentText.trim()) ||
      sub.personalNumber.includes(searchStudentText.trim()) ||
      sub.assignmentTitle.includes(searchStudentText.trim());
    return matchClass && matchSearch;
  });

  // State for Editing Student
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editStudentName, setEditStudentName] = useState('');
  const [editStudentPersonalNumber, setEditStudentPersonalNumber] = useState('');
  const [editStudentClassId, setEditStudentClassId] = useState('');

  // State for Editing Class Name
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editingClassName, setEditingClassName] = useState('');

  // State for Editing Assignment
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [editAsgTitle, setEditAsgTitle] = useState('');
  const [editAsgClassId, setEditAsgClassId] = useState('');
  const [editAsgStartAyah, setEditAsgStartAyah] = useState<number>(1);
  const [editAsgEndAyah, setEditAsgEndAyah] = useState<number>(12);
  const [editAsgInstructions, setEditAsgInstructions] = useState('');

  // Search & Filter in Student Roster
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterClassFilter, setRosterClassFilter] = useState('all');

  // Filtered students roster
  const filteredStudentsRoster = students.filter((std) => {
    const matchClass = rosterClassFilter === 'all' || std.classId === rosterClassFilter;
    const matchSearch =
      !rosterSearch.trim() ||
      std.name.includes(rosterSearch.trim()) ||
      std.personalNumber.includes(rosterSearch.trim());
    return matchClass && matchSearch;
  });

  // Handlers for Student Operations
  const handleOpenEditStudent = (std: Student) => {
    setEditingStudent(std);
    setEditStudentName(std.name);
    setEditStudentPersonalNumber(std.personalNumber);
    setEditStudentClassId(std.classId);
  };

  const handleSaveStudentEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !editStudentName.trim() || !editStudentPersonalNumber.trim() || !editStudentClassId) return;

    updateStudent(editingStudent.id, {
      name: editStudentName.trim(),
      personalNumber: editStudentPersonalNumber.trim(),
      classId: editStudentClassId,
    });

    setEditingStudent(null);
    onDataRefresh();
  };

  const handleDeleteStudentWithConfirm = (std: Student) => {
    if (window.confirm(`هل أنت متأكد من حذف الطالب "${std.name}" (الرقم: ${std.personalNumber}) نهائياً؟`)) {
      deleteStudent(std.id);
      onDataRefresh();
    }
  };

  // Handlers for Class Operations
  const handleOpenEditClass = (cls: ClassRoom) => {
    setEditingClassId(cls.id);
    setEditingClassName(cls.name);
  };

  const handleSaveClassEdit = (classId: string) => {
    if (!editingClassName.trim()) return;
    updateClass(classId, editingClassName.trim());
    setEditingClassId(null);
    onDataRefresh();
  };

  const handleClearClassStudents = (classId: string, className: string) => {
    const classStudentCount = students.filter((s) => s.classId === classId).length;
    if (classStudentCount === 0) {
      alert(`صف "${className}" لا يحتوي على أي طالب حالياً.`);
      return;
    }

    if (
      window.confirm(
        `تنبيه: هل أنت متأكد من حذف جميع طلاب صف "${className}" وعددهم (${classStudentCount}) طالب؟ لا يمكن التراجع بعد الحذف.`
      )
    ) {
      deleteStudentsInClass(classId);
      onDataRefresh();
    }
  };

  const handleDeleteClassWithConfirm = (cls: ClassRoom) => {
    const classStudentCount = students.filter((s) => s.classId === cls.id).length;
    const msg =
      classStudentCount > 0
        ? `تنبيه: صف "${cls.name}" يحتوي على (${classStudentCount}) طالب مسجل. هل أنت متأكد من حذفه وحذف الصف نهائياً؟`
        : `هل أنت متأكد من حذف صف "${cls.name}" نهائياً؟`;

    if (window.confirm(msg)) {
      if (classStudentCount > 0) {
        deleteStudentsInClass(cls.id);
      }
      deleteClass(cls.id);
      onDataRefresh();
    }
  };

  // Handlers for Assignment Operations
  const handleOpenEditAssignment = (asg: Assignment) => {
    setEditingAssignment(asg);
    setEditAsgTitle(asg.title);
    setEditAsgClassId(asg.classId);
    setEditAsgStartAyah(asg.startAyah);
    setEditAsgEndAyah(asg.endAyah);
    setEditAsgInstructions(asg.instructions || '');
  };

  const handleSaveAssignmentEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAssignment || !editAsgTitle.trim() || !editAsgClassId) return;

    const start = Math.min(editAsgStartAyah, editAsgEndAyah);
    const end = Math.max(editAsgStartAyah, editAsgEndAyah);

    updateAssignment(editingAssignment.id, {
      title: editAsgTitle.trim(),
      classId: editAsgClassId,
      startAyah: start,
      endAyah: end,
      instructions: editAsgInstructions.trim(),
    });

    setEditingAssignment(null);
    onDataRefresh();
  };

  const handleDeleteAssignmentWithConfirm = (asg: Assignment) => {
    if (window.confirm(`هل أنت متأكد من حذف الواجب "${asg.title}"؟`)) {
      deleteAssignment(asg.id);
      onDataRefresh();
    }
  };

  const handleDeleteAllAssignments = () => {
    if (assignments.length === 0) {
      alert('لا توجد أي واجبات مسندة حالياً.');
      return;
    }

    if (
      window.confirm(
        `تنبيه: هل أنت متأكد من رغبتك في حذف جميع الواجبات المسندة (${assignments.length} واجب) نهائياً؟ لا يمكن التراجع عن هذه العملية.`
      )
    ) {
      deleteAllAssignments();
      onDataRefresh();
    }
  };

  const handleExportStudentsRoster = () => {
    const listToExport = rosterClassFilter === 'all'
      ? students
      : students.filter((s) => s.classId === rosterClassFilter);

    if (listToExport.length === 0) {
      alert('لا توجد بيانات طلاب للتصدير.');
      return;
    }

    const className = classes.find((c) => c.id === rosterClassFilter)?.name;
    const filename = className ? `قائمة_طلاب_${className}` : 'كشف_جميع_الطلاب';
    exportStudentsListToExcel(listToExport, classes, filename);
  };

  const handleDeleteAllStudents = () => {
    if (students.length === 0) {
      alert('لا يوجد أي طالب مسجل حالياً.');
      return;
    }

    if (
      window.confirm(
        `تنبيه: هل أنت متأكد من رغبتك في حذف جميع الطلاب المسجلين (${students.length} طالب) نهائياً من كافة الصفوف؟ لا يمكن التراجع عن هذه العملية.`
      )
    ) {
      deleteAllStudents();
      onDataRefresh();
    }
  };

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    saveClass(newClassName.trim());
    setNewClassName('');
    onDataRefresh();
  };

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || !newStudentPersonalId.trim() || !newStudentClassId) return;

    saveStudent({
      name: newStudentName.trim(),
      personalNumber: newStudentPersonalId.trim(),
      classId: newStudentClassId,
    });

    setNewStudentName('');
    setNewStudentPersonalId('');
    onDataRefresh();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!bulkClassId) {
      setBulkUploadMsg({ type: 'error', text: 'يرجى اختيار الصف المراد إضافة الطلاب إليه أولاً.' });
      return;
    }

    setIsUploading(true);
    setBulkUploadMsg(null);

    try {
      const parsedRows = await parseStudentsFile(file);
      if (parsedRows.length === 0) {
        setBulkUploadMsg({
          type: 'error',
          text: 'لم يتم العثور على بيانات طلاب في الملف. تأكد من وجود عمودي (اسم الطالب) و(الرقم الشخصي).',
        });
        return;
      }

      const rowsWithClass = parsedRows.map((r) => ({
        ...r,
        classId: bulkClassId,
      }));

      const addedCount = saveBulkStudents(rowsWithClass);
      setBulkUploadMsg({
        type: 'success',
        text: `تم استيراد ${addedCount} طالب بنجاح وإضافتهم إلى الصف المحدد!`,
      });
      onDataRefresh();
    } catch (err) {
      console.error('File parse error:', err);
      setBulkUploadMsg({
        type: 'error',
        text: 'حدث خطأ أثناء قراءة الملف. يرجى التأكد من صيغة Excel أو CSV الصحيحة.',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!asgTitle.trim() || !asgClassId) return;

    const start = Math.min(asgStartAyah, asgEndAyah);
    const end = Math.max(asgStartAyah, asgEndAyah);

    saveAssignment({
      classId: asgClassId,
      title: asgTitle.trim(),
      startAyah: start,
      endAyah: end,
      instructions: asgInstructions.trim(),
    });

    setAsgSuccessMsg(
      asgClassId === 'all'
        ? 'تم إنشاء الواجب وتوجيهه لجميع الفرق بنجاح!'
        : 'تم إنشاء الواجب وتوجيهه لطلاب الصف بنجاح!'
    );
    setTimeout(() => setAsgSuccessMsg(''), 4000);
    onDataRefresh();
  };

  const handleGradeChange = (subId: string, val: string) => {
    setEditingFeedback((prev) => ({
      ...prev,
      [subId]: {
        ...prev[subId],
        grade: val,
      },
    }));
  };

  const handleNotesChange = (subId: string, val: string) => {
    setEditingFeedback((prev) => ({
      ...prev,
      [subId]: {
        ...prev[subId],
        notes: val,
      },
    }));
  };

  const handleSaveFeedback = (sub: Submission) => {
    const feedback = editingFeedback[sub.id];
    const gradeVal = feedback?.grade !== undefined ? feedback.grade : (sub.teacherGrade?.toString() || '');
    const notesVal = feedback?.notes !== undefined ? feedback.notes : sub.teacherNotes;

    const parsedGrade = gradeVal === '' ? null : Math.min(10, Math.max(0, parseFloat(gradeVal)));

    updateSubmissionTeacherFeedback(sub.id, parsedGrade, notesVal);

    setEditingFeedback((prev) => ({
      ...prev,
      [sub.id]: {
        grade: parsedGrade !== null ? parsedGrade.toString() : '',
        notes: notesVal,
        savedMsg: true,
      },
    }));

    setTimeout(() => {
      setEditingFeedback((prev) => ({
        ...prev,
        [sub.id]: {
          ...prev[sub.id],
          savedMsg: false,
        },
      }));
    }, 2500);

    onDataRefresh();
  };

  const handleDeleteSubmission = async (sub: Submission) => {
    if (window.confirm(`هل أنت متأكد من حذف استجابة الطالب (${sub.studentName}) والسماح له بإعادة المحاولة؟`)) {
      await deleteSubmission(sub.id);
      onDataRefresh();
    }
  };

  const previewAyahs = getVerseRangeText(asgStartAyah, asgEndAyah);

  return (
    <div className="space-y-6">
      {/* Top Banner Navigation & Quick Stats */}
      <div className="bg-linear-to-r from-emerald-950 via-teal-950 to-emerald-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-amber-300 bg-amber-400/20 px-2.5 py-1 rounded-full border border-amber-300/30">
              لوحة تحكم المعلم المشرف
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-2">
              إدارة المقرأة والتلاوات القرآنية
            </h1>
            <p className="text-xs sm:text-sm text-emerald-200/90 mt-1">
              متابعة تلاوات الطلاب، التدقيق على تقييم الذكاء الاصطناعي، وإدارة الصفوف والواجبات
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="bg-white/10 px-4 py-2.5 rounded-2xl border border-white/20 text-center">
              <span className="text-[10px] text-emerald-200 block">الصفوف</span>
              <span className="text-lg font-black font-mono">{classes.length}</span>
            </div>
            <div className="bg-white/10 px-4 py-2.5 rounded-2xl border border-white/20 text-center">
              <span className="text-[10px] text-emerald-200 block">الطلاب</span>
              <span className="text-lg font-black font-mono">{students.length}</span>
            </div>
            <div className="bg-white/10 px-4 py-2.5 rounded-2xl border border-white/20 text-center">
              <span className="text-[10px] text-emerald-200 block">التلاوات</span>
              <span className="text-lg font-black font-mono">{submissions.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Section Navigation Switcher */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-stone-200 shadow-xs">
        <button
          onClick={() => onSectionChange('submissions')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeSection === 'submissions'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-stone-600 hover:text-emerald-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>جدول استجابات وتلاوات الطلاب ({submissions.length})</span>
        </button>

        <button
          onClick={() => onSectionChange('classes')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeSection === 'classes'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-stone-600 hover:text-emerald-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>إدارة الصفوف والطلاب ({classes.length} صفوف)</span>
        </button>

        <button
          onClick={() => onSectionChange('assignments')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeSection === 'assignments'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-stone-600 hover:text-emerald-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>إسناد واجبات سورة يس</span>
        </button>
      </div>

      {/* SECTION 1: SUBMISSIONS & GRADING TABLE */}
      {activeSection === 'submissions' && (
        <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
          {/* Action Bar with Search, Class Filter, and Export Button */}
          <div className="p-5 border-b border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Class Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-stone-400" />
                <select
                  value={selectedClassFilter}
                  onChange={(e) => setSelectedClassFilter(e.target.value)}
                  className="text-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                >
                  <option value="all">جميع الصفوف الدراسية</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search text */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="ابحث باسم الطالب أو الرقم الشخصي..."
                  value={searchStudentText}
                  onChange={(e) => setSearchStudentText(e.target.value)}
                  className="text-xs bg-stone-50 border border-stone-200 rounded-xl pr-9 pl-3 py-2 w-64 focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
                <Search className="w-3.5 h-3.5 text-stone-400 absolute right-3 top-3" />
              </div>
            </div>

            {/* Export Data Button */}
            <button
              onClick={() => exportSubmissionsToExcel(filteredSubmissions)}
              disabled={filteredSubmissions.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
              title="تصدير كافة الدرجات والاستجابات إلى ملف Excel"
            >
              <Download className="w-4 h-4" />
              <span>تصدير البيانات (Excel)</span>
            </button>
          </div>

          {/* Submissions Table */}
          {filteredSubmissions.length === 0 ? (
            <div className="p-12 text-center text-stone-500">
              <FileSpreadsheet className="w-12 h-12 mx-auto text-stone-300 mb-3" />
              <p className="font-bold text-sm text-stone-700">لا توجد تسجيلات مطابقة</p>
              <p className="text-xs text-stone-400 mt-1">
                عندما يقوم الطلاب بتسجيل تلاواتهم وإرسالها ستظهر فوراً في هذا الجدول للاستماع والتقييم.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-600 font-bold">
                    <th className="py-3.5 px-4">الصف الدراسي</th>
                    <th className="py-3.5 px-4">اسم الطالب والرقم</th>
                    <th className="py-3.5 px-4">الواجب الأسبوعي</th>
                    <th className="py-3.5 px-4 min-w-[170px]">مشغل الصوت الفعلي</th>
                    <th className="py-3.5 px-4 text-center">تقييم AI</th>
                    <th className="py-3.5 px-4 min-w-[110px]">درجة المعلم (من 10)</th>
                    <th className="py-3.5 px-4 min-w-[200px]">ملاحظات وتوجيه المعلم</th>
                    <th className="py-3.5 px-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredSubmissions.map((sub) => {
                    const currentGrade =
                      editingFeedback[sub.id]?.grade !== undefined
                        ? editingFeedback[sub.id].grade
                        : sub.teacherGrade !== null
                        ? sub.teacherGrade.toString()
                        : '';

                    const currentNotes =
                      editingFeedback[sub.id]?.notes !== undefined
                        ? editingFeedback[sub.id].notes
                        : sub.teacherNotes || '';

                    const isSaved = editingFeedback[sub.id]?.savedMsg;

                    return (
                      <tr key={sub.id} className="hover:bg-stone-50/60 transition-colors">
                        <td className="py-3 px-4 font-semibold text-emerald-950">
                          {sub.className}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-stone-900">{sub.studentName}</div>
                          <div className="text-[10px] text-stone-500 font-mono">#{sub.personalNumber}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-stone-800 line-clamp-1">{sub.assignmentTitle}</div>
                          <div className="text-[10px] text-stone-400">
                            {new Date(sub.submittedAt).toLocaleDateString('ar-SA')}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <AudioPlayer audioSrc={sub.audioBase64} compact />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex flex-col items-center gap-1">
                            <span className="font-black font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-xs">
                              عام: {sub.aiScore} / 10
                            </span>
                            <span className="font-bold font-mono text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 text-[11px]">
                              تجويد: {sub.tajweedScore !== undefined ? sub.tajweedScore : sub.aiScore} / 10
                            </span>
                            <span className="text-[10px] text-stone-400">
                              {sub.accuracyPercentage}% دقة
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.5"
                              value={currentGrade}
                              onChange={(e) => handleGradeChange(sub.id, e.target.value)}
                              placeholder="10"
                              className="w-14 text-center py-1.5 px-1 bg-white border border-stone-200 rounded-lg text-xs font-bold font-mono focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                            />
                            <span className="text-[10px] text-stone-400">/ 10</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={currentNotes}
                            onChange={(e) => handleNotesChange(sub.id, e.target.value)}
                            placeholder="اكتب ملاحظة أو توجيهاً للطالب..."
                            className="w-full py-1.5 px-2.5 bg-white border border-stone-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleSaveFeedback(sub)}
                              className={`p-2 rounded-lg text-white transition-all shadow-2xs ${
                                isSaved ? 'bg-teal-600' : 'bg-emerald-700 hover:bg-emerald-800'
                              }`}
                              title={isSaved ? 'تم الحفظ!' : 'حفظ الدرجة والملاحظات'}
                            >
                              {isSaved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => setInspectSubmission(sub)}
                              className="p-2 text-stone-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg border border-stone-200 transition-colors"
                              title="معاينة فحص الكلمات وتظليل الأخطاء"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteSubmission(sub)}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
                              title="حذف الاستجابة / السماح للطالب بإعادة المحاولة"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: CLASSES & STUDENTS MANAGEMENT */}
      {activeSection === 'classes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Forms */}
          <div className="lg:col-span-5 space-y-6">
            {/* Create Class Card */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <span className="p-2 bg-emerald-50 text-emerald-800 rounded-xl">
                  <Plus className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-sm text-stone-900">إنشاء صف دراسي جديد</h3>
              </div>

              <form onSubmit={handleCreateClass} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    اسم الصف الدراسي:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: الصف الثالث (تجويد)"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  إضافة الصف
                </button>
              </form>
            </div>

            {/* Bulk Import Card */}
            <div className="bg-white p-6 rounded-3xl border border-emerald-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-amber-50 text-amber-800 rounded-xl border border-amber-200">
                    <Upload className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-stone-900">رفع جماعي للطلاب (Bulk Import)</h3>
                    <p className="text-[11px] text-stone-500">إضافة جميع طلاب الصف بنقرة واحدة عبر Excel أو CSV</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    اختر الصف المراد إضافة الطلاب إليه:
                  </label>
                  <select
                    value={bulkClassId}
                    onChange={(e) => setBulkClassId(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="border-2 border-dashed border-emerald-300 bg-emerald-50/40 rounded-2xl p-4 text-center hover:bg-emerald-50 transition-colors">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                    id="excel-file-input"
                  />
                  <label
                    htmlFor="excel-file-input"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <FileSpreadsheet className="w-8 h-8 text-emerald-700" />
                    <span className="text-xs font-bold text-emerald-900">
                      {isUploading ? 'جاري معالجة الملف...' : 'اضغط لاختيار ملف Excel أو CSV'}
                    </span>
                    <span className="text-[10px] text-stone-500">
                      يجب أن يحتوي الملف على عمودي (اسم الطالب) و(الرقم الشخصي)
                    </span>
                  </label>
                </div>

                {bulkUploadMsg && (
                  <div
                    className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                      bulkUploadMsg.type === 'success'
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'bg-red-100 text-red-900 border border-red-300'
                    }`}
                  >
                    {bulkUploadMsg.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
                    )}
                    <span>{bulkUploadMsg.text}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={downloadSampleExcelTemplate}
                  className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border border-stone-200"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تنزيل قالب ملف Excel النوذجي</span>
                </button>
              </div>
            </div>

            {/* Single Student Add Card */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <span className="p-2 bg-emerald-50 text-emerald-800 rounded-xl">
                  <GraduationCap className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-sm text-stone-900">إضافة طالب منفرد</h3>
              </div>

              <form onSubmit={handleCreateStudent} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    اسم الطالب الثلاثي:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: أحمد محمد علي"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    الرقم الشخصي / الأكاديمي:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: 123456"
                    value={newStudentPersonalId}
                    onChange={(e) => setNewStudentPersonalId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    تنسيب الطالب للصف الدراسي:
                  </label>
                  <select
                    value={newStudentClassId}
                    onChange={(e) => setNewStudentClassId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  حفظ إضافة الطالب
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Roster & Management */}
          <div className="lg:col-span-7 space-y-6">
            {/* Registered Classes List Card */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs">
              <h3 className="font-bold text-sm text-stone-900 mb-4 flex items-center justify-between">
                <span>الصفوف الدراسية المسجلة ({classes.length})</span>
              </h3>

              <div className="space-y-2">
                {classes.map((cls) => {
                  const classStudentCount = students.filter((s) => s.classId === cls.id).length;
                  const isEditingThisClass = editingClassId === cls.id;

                  return (
                    <div
                      key={cls.id}
                      className="p-3.5 bg-stone-50/80 rounded-2xl border border-stone-200/80 flex items-center justify-between gap-2"
                    >
                      {isEditingThisClass ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={editingClassName}
                            onChange={(e) => setEditingClassName(e.target.value)}
                            className="text-xs bg-white border border-stone-300 rounded-xl px-3 py-1.5 flex-1 focus:ring-2 focus:ring-emerald-700 focus:outline-none font-bold"
                          />
                          <button
                            onClick={() => handleSaveClassEdit(cls.id)}
                            className="p-1.5 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800"
                            title="حفظ"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingClassId(null)}
                            className="p-1.5 bg-stone-200 text-stone-700 rounded-lg hover:bg-stone-300"
                            title="إلغاء"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div>
                            <h4 className="font-bold text-xs text-stone-900">{cls.name}</h4>
                            <span className="text-[10px] text-stone-500">
                              عدد الطلاب المسجلين: {classStudentCount} طالب
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditClass(cls)}
                              className="p-1.5 text-stone-600 hover:text-emerald-800 hover:bg-white rounded-lg transition-colors"
                              title="تعديل اسم الصف"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleClearClassStudents(cls.id, cls.name)}
                              className="p-1.5 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors text-[11px] font-bold flex items-center gap-1"
                              title="حذف جميع طلاب هذا الصف فقط"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">تفريغ الطلاب</span>
                            </button>

                            <button
                              onClick={() => handleDeleteClassWithConfirm(cls)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="حذف الصف بالكامل"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Students List Roster Card */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                <div>
                  <h3 className="font-bold text-sm text-stone-900">
                    قائمة وسجل الطلاب ({filteredStudentsRoster.length})
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    البحث، التعديل، التصدير، والإدارة الشاملة للطلاب
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportStudentsRoster}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تصدير القائمة</span>
                  </button>

                  <button
                    onClick={handleDeleteAllStudents}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف جميع الطلاب</span>
                  </button>
                </div>
              </div>

              {/* Roster Search and Filter Controls */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <input
                    type="text"
                    placeholder="ابحث بالاسم أو الرقم الشخصي..."
                    value={rosterSearch}
                    onChange={(e) => setRosterSearch(e.target.value)}
                    className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl pr-9 pl-3 py-2 focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  />
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute right-3 top-2.5" />
                </div>

                <select
                  value={rosterClassFilter}
                  onChange={(e) => setRosterClassFilter(e.target.value)}
                  className="w-full sm:w-auto text-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                >
                  <option value="all">كافة الصفوف</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Roster Table */}
              {filteredStudentsRoster.length === 0 ? (
                <div className="p-8 text-center text-stone-400 text-xs">
                  لا يوجد طلاب مطابقون لمعايير البحث.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold">
                        <th className="py-2.5 px-3">الاسم</th>
                        <th className="py-2.5 px-3">الرقم الشخصي</th>
                        <th className="py-2.5 px-3">الصف الدراسي</th>
                        <th className="py-2.5 px-3 text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {filteredStudentsRoster.map((std) => {
                        const stdClass = classes.find((c) => c.id === std.classId);

                        return (
                          <tr key={std.id} className="hover:bg-stone-50/50">
                            <td className="py-2.5 px-3 font-bold text-stone-900">{std.name}</td>
                            <td className="py-2.5 px-3 font-mono text-stone-600">#{std.personalNumber}</td>
                            <td className="py-2.5 px-3 text-emerald-900 font-medium">
                              {stdClass?.name || 'غير محدد'}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleOpenEditStudent(std)}
                                  className="p-1 text-stone-500 hover:text-emerald-800 hover:bg-stone-100 rounded-lg"
                                  title="تعديل بيانات الطالب"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteStudentWithConfirm(std)}
                                  className="p-1 text-red-500 hover:bg-red-50 rounded-lg"
                                  title="حذف الطالب"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: ASSIGNMENTS MANAGEMENT */}
      {activeSection === 'assignments' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Create Assignment Form */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="p-2 bg-emerald-50 text-emerald-800 rounded-xl">
                  <BookOpen className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-stone-900">إسناد واجب قرآني جديد</h3>
                  <p className="text-[11px] text-stone-500">تحديد الآيات المطلوبة من سورة يس وتوجيهها للطلاب</p>
                </div>
              </div>

              <form onSubmit={handleCreateAssignment} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    عنوان الواجب القرآني:
                  </label>
                  <input
                    type="text"
                    required
                    value={asgTitle}
                    onChange={(e) => setAsgTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-700 focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    توجيه الواجب إلى:
                  </label>
                  <select
                    value={asgClassId}
                    onChange={(e) => setAsgClassId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  >
                    <option value="all">كافة الفرق والصفوف (الجميع)</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">
                      من الآية (سورة يس):
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="83"
                      value={asgStartAyah}
                      onChange={(e) => setAsgStartAyah(parseInt(e.target.value) || 1)}
                      className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">
                      إلى الآية (سورة يس):
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="83"
                      value={asgEndAyah}
                      onChange={(e) => setAsgEndAyah(parseInt(e.target.value) || 12)}
                      className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    تعليمات وتوجيهات المعلم:
                  </label>
                  <textarea
                    rows={2}
                    value={asgInstructions}
                    onChange={(e) => setAsgInstructions(e.target.value)}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  ></textarea>
                </div>

                {asgSuccessMsg && (
                  <div className="p-3 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>{asgSuccessMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  حفظ ونشر الواجب للطلاب
                </button>
              </form>
            </div>
          </div>

          {/* Existing Assignments & Ayahs Preview */}
          <div className="lg:col-span-6 space-y-6">
            {/* Verses Preview Box */}
            <div className="bg-amber-50/50 p-5 rounded-3xl border border-amber-200 shadow-xs">
              <h4 className="text-xs font-bold text-amber-950 mb-2 flex items-center justify-between">
                <span>معاينة النص القرآني المختار للواجب:</span>
                <span className="font-mono bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                  الآيات {asgStartAyah} - {asgEndAyah}
                </span>
              </h4>

              <div className="bg-white p-4 rounded-2xl border border-amber-200/80 text-right font-quran text-lg leading-loose text-stone-900 max-h-48 overflow-y-auto">
                {previewAyahs.map((a) => (
                  <span key={a.number} className="inline">
                    {a.text}{' '}
                    <span className="inline-flex items-center justify-center w-6 h-6 mx-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-mono font-bold align-middle">
                      {a.number}
                    </span>{' '}
                  </span>
                ))}
              </div>
            </div>

            {/* Existing Assignments List */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <h3 className="font-bold text-sm text-stone-900">
                  الواجبات المسندة حالياً ({assignments.length})
                </h3>

                <button
                  onClick={handleDeleteAllAssignments}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف جميع الواجبات</span>
                </button>
              </div>

              {assignments.length === 0 ? (
                <div className="p-8 text-center text-stone-400 text-xs">
                  لا توجد واجبات مسندة حالياً.
                </div>
              ) : (
                <div className="space-y-3">
                  {assignments.map((asg) => {
                    const assignedClass = classes.find((c) => c.id === asg.classId);

                    return (
                      <div
                        key={asg.id}
                        className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex items-start justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-xs text-stone-900">{asg.title}</span>
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full border border-emerald-200">
                              {asg.classId === 'all' ? 'جميع الصفوف' : assignedClass?.name || 'صف محدد'}
                            </span>
                          </div>

                          <p className="text-xs text-emerald-800 font-semibold">
                            سورة يس • الآيات ({asg.startAyah} - {asg.endAyah})
                          </p>

                          {asg.instructions && (
                            <p className="text-[11px] text-stone-500 mt-1 line-clamp-2">
                              {asg.instructions}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleOpenEditAssignment(asg)}
                            className="p-1.5 text-stone-600 hover:text-emerald-800 hover:bg-white rounded-lg transition-colors"
                            title="تعديل الواجب"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAssignmentWithConfirm(asg)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="حذف الواجب"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EDIT STUDENT MODAL */}
      {editingStudent && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-stone-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-sm text-stone-900">تعديل بيانات الطالب</h3>
              <button
                onClick={() => setEditingStudent(null)}
                className="p-1 text-stone-400 hover:text-stone-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudentEdit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  اسم الطالب:
                </label>
                <input
                  type="text"
                  required
                  value={editStudentName}
                  onChange={(e) => setEditStudentName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  الرقم الشخصي / الأكاديمي:
                </label>
                <input
                  type="text"
                  required
                  value={editStudentPersonalNumber}
                  onChange={(e) => setEditStudentPersonalNumber(e.target.value)}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  الصف الدراسي:
                </label>
                <select
                  value={editStudentClassId}
                  onChange={(e) => setEditStudentClassId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ASSIGNMENT MODAL */}
      {editingAssignment && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-stone-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-sm text-stone-900">تعديل بيانات الواجب القرآني</h3>
              <button
                onClick={() => setEditingAssignment(null)}
                className="p-1 text-stone-400 hover:text-stone-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAssignmentEdit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  عنوان الواجب:
                </label>
                <input
                  type="text"
                  required
                  value={editAsgTitle}
                  onChange={(e) => setEditAsgTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  الصف الموجه له الواجب:
                </label>
                <select
                  value={editAsgClassId}
                  onChange={(e) => setEditAsgClassId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                >
                  <option value="all">كافة الفرق والصفوف (الجميع)</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    من الآية:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="83"
                    value={editAsgStartAyah}
                    onChange={(e) => setEditAsgStartAyah(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    إلى الآية:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="83"
                    value={editAsgEndAyah}
                    onChange={(e) => setEditAsgEndAyah(parseInt(e.target.value) || 12)}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  التعليمات والتوجيهات:
                </label>
                <textarea
                  rows={2}
                  value={editAsgInstructions}
                  onChange={(e) => setEditAsgInstructions(e.target.value)}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingAssignment(null)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSPECT SUBMISSION DETAILS MODAL */}
      {inspectSubmission && (
        <EvaluationModal
          isOpen={!!inspectSubmission}
          onClose={() => setInspectSubmission(null)}
          aiScore={inspectSubmission.aiScore}
          accuracyPercentage={inspectSubmission.accuracyPercentage}
          tajweedScore={inspectSubmission.tajweedScore}
          tajweedReport={inspectSubmission.tajweedReport}
          wordEvaluations={inspectSubmission.wordEvaluations}
          summaryFeedback={inspectSubmission.teacherNotes || 'استجابة معتمدة'}
          audioBase64={inspectSubmission.audioBase64}
        />
      )}
    </div>
  );
};
