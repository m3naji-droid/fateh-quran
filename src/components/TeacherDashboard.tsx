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
  Sparkles,
  AlertCircle,
  HelpCircle,
  FileText,
  Pencil,
  X,
  Check,
  ArrowRightLeft,
  UserX,
  GraduationCap
} from 'lucide-react';
import { Assignment, ClassRoom, Student, Submission } from '../types';
import { AudioPlayer } from './AudioPlayer';
import { EvaluationModal } from './EvaluationModal';
import { SURAH_YASIN, getVerseRangeText } from '../data/surahYasin';
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
  // Filter states
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

  // Handle Opening Student Edit Modal
  const handleOpenEditStudent = (std: Student) => {
    setEditingStudent(std);
    setEditStudentName(std.name);
    setEditStudentPersonalNumber(std.personalNumber);
    setEditStudentClassId(std.classId);
  };

  // Handle Saving Student Edit
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

  // Handle Deleting Student
  const handleDeleteStudentWithConfirm = (std: Student) => {
    if (window.confirm(`هل أنت متأكد من حذف الطالب "${std.name}" (الرقم: ${std.personalNumber}) نهائياً؟`)) {
      deleteStudent(std.id);
      onDataRefresh();
    }
  };

  // Handle Class Name Edit
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

  // Handle Clearing All Students in a Class
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

  // Handle Deleting Class
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

  // Handle Opening Assignment Edit Modal
  const handleOpenEditAssignment = (asg: Assignment) => {
    setEditingAssignment(asg);
    setEditAsgTitle(asg.title);
    setEditAsgClassId(asg.classId);
    setEditAsgStartAyah(asg.startAyah);
    setEditAsgEndAyah(asg.endAyah);
    setEditAsgInstructions(asg.instructions || '');
  };

  // Handle Saving Assignment Edit
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

  // Handle Deleting Assignment
  const handleDeleteAssignmentWithConfirm = (asg: Assignment) => {
    if (window.confirm(`هل أنت متأكد من حذف الواجب "${asg.title}"؟`)) {
      deleteAssignment(asg.id);
      onDataRefresh();
    }
  };

  // Handle Deleting All Assigned Assignments
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

  // Handle Exporting Students Roster to Excel
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

  // Handle Deleting All Registered Students
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

  // Handle Class Creation
  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    saveClass(newClassName.trim());
    setNewClassName('');
    onDataRefresh();
  };

  // Handle Single Student Creation
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

  // Handle Bulk Excel/CSV Upload
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

  // Handle New Assignment Creation
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

  // Handle Feedback updates for submission
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
          ...prev[subId(sub.id)],
          savedMsg: false,
        },
      }));
    }, 2500);

    onDataRefresh();
  };

  function subId(id: string) {
    return id;
  }

  // Handle Delete Submission / Allow Retry
  const handleDeleteSubmission = async (sub: Submission) => {
    if (window.confirm(`هل أنت متأكد من حذف استجابة الطالب (${sub.studentName}) والسماح له بإعادة المحاولة؟`)) {
      await deleteSubmission(sub.id);
      onDataRefresh();
    }
  };

  // Ayahs preview for assignment form
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

            {/* Export Data Button (Excel / CSV) */}
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
                        {/* Class Name */}
                        <td className="py-3 px-4 font-semibold text-emerald-950">
                          {sub.className}
                        </td>

                        {/* Student Name & Personal ID */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-stone-900">{sub.studentName}</div>
                          <div className="text-[10px] text-stone-500 font-mono">#{sub.personalNumber}</div>
                        </td>

                        {/* Assignment Title */}
                        <td className="py-3 px-4">
                          <div className="font-medium text-stone-800 line-clamp-1">{sub.assignmentTitle}</div>
                          <div className="text-[10px] text-stone-400">
                            {new Date(sub.submittedAt).toLocaleDateString('ar-SA')}
                          </div>
                        </td>

                        {/* Audio Player */}
                        <td className="py-3 px-4">
                          <AudioPlayer audioSrc={sub.audioBase64} compact />
                        </td>

                        {/* AI & Tajweed Score */}
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

                        {/* Teacher Grade Input */}
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

                        {/* Teacher Notes Input */}
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={currentNotes}
                            onChange={(e) => handleNotesChange(sub.id, e.target.value)}
                            placeholder="اكتب ملاحظة أو توجيهاً للطالب..."
                            className="w-full py-1.5 px-2.5 bg-white border border-stone-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                          />
                        </td>

                        {/* Actions (Save, View Details, Delete / Allow Retry) */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Save Grade & Notes */}
                            <button
                              onClick={() => handleSaveFeedback(sub)}
                              className={`p-2 rounded-lg text-white transition-all shadow-2xs ${
                                isSaved ? 'bg-teal-600' : 'bg-emerald-700 hover:bg-emerald-800'
                              }`}
                              title={isSaved ? 'تم الحفظ!' : 'حفظ الدرجة والملاحظات'}
                            >
                              {isSaved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                            </button>

                            {/* View AI details */}
                            <button
                              onClick={() => setInspectSubmission(sub)}
                              className="p-2 text-stone-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg border border-stone-200 transition-colors"
                              title="معاينة فحص الكلمات وتظليل الأخطاء"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Submission / Allow Retry */}
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
          {/* Left Column: Add Class & Bulk Import */}
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

            {/* Bulk Upload Excel/CSV Card */}
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
                {/* Select destination class */}
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

                {/* Upload Zone */}
                <div className="border-2 border-dashed border-emerald-300 bg-emerald-50/40 rounded-2xl p-5 text-center flex flex-col items-center justify-center">
                  <FileSpreadsheet className="w-8 h-8 text-emerald-700 mb-2" />
                  <p className="text-xs font-bold text-emerald-950 mb-1">
                    اختر ملف Excel (.xlsx, .xls) أو ملف CSV
                  </p>
                  <p className="text-[11px] text-stone-500 mb-3">
                    يحتوي الملف على عمودين: (اسم الطالب | الرقم الشخصي)
                  </p>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="excel-file-input"
                  />

                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <label
                      htmlFor="excel-file-input"
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploading ? 'جاري الاستيراد...' : 'اختيار ورفع الملف'}</span>
                    </label>

                    <button
                      type="button"
                      onClick={downloadSampleExcelTemplate}
                      className="px-3 py-2 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-xl text-xs font-semibold transition-all flex items-center gap-1"
                      title="تحميل نموذج إكسل فارغ لقائمة الطلاب"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>تحميل نموذج إكسل</span>
                    </button>
                  </div>
                </div>

                {bulkUploadMsg && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                      bulkUploadMsg.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                  >
                    {bulkUploadMsg.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{bulkUploadMsg.text}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Individual Add Student Card */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs">
              <h3 className="font-bold text-sm text-stone-900 mb-3">إضافة طالب فردي</h3>
              <form onSubmit={handleCreateStudent} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">الصف:</label>
                  <select
                    value={newStudentClassId}
                    onChange={(e) => setNewStudentClassId(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">اسم الطالب:</label>
                  <input
                    type="text"
                    required
                    placeholder="الاسم الثلاثي للطالب"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">الرقم الشخصي:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: 105"
                    value={newStudentPersonalId}
                    onChange={(e) => setNewStudentPersonalId(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-bold transition-all"
                >
                  إضافة الطالب
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Existing Classes & Student Roster */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-sm text-stone-900">إدارة الطلاب والصفوف</h3>
                  <p className="text-xs text-stone-500">
                    مجموع {students.length} طالب مسجل في {classes.length} صفوف دراسية
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                  <button
                    type="button"
                    onClick={handleExportStudentsRoster}
                    className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    title="تصدير كشف الطلاب إلى ملف Excel"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>تصدير كشف الطلاب (Excel)</span>
                  </button>

                  {students.length > 0 && (
                    <button
                      type="button"
                      onClick={handleDeleteAllStudents}
                      className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      title="حذف جميع الطلاب المسجلين دفعة واحدة"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>حذف جميع الطلاب</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Roster Search & Filter Bar */}
              <div className="p-3.5 bg-stone-50/70 border-b border-stone-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="بحث سريع باسم الطالب أو الرقم الشخصي..."
                    value={rosterSearch}
                    onChange={(e) => setRosterSearch(e.target.value)}
                    className="w-full pr-8.5 pl-7 py-2 bg-white border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  />
                  {rosterSearch && (
                    <button
                      onClick={() => setRosterSearch('')}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <select
                  value={rosterClassFilter}
                  onChange={(e) => setRosterClassFilter(e.target.value)}
                  className="px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                >
                  <option value="all">عرض جميع الفرق ({students.length} طالب)</option>
                  {classes.map((c) => {
                    const cCount = students.filter((s) => s.classId === c.id).length;
                    return (
                      <option key={c.id} value={c.id}>
                        {c.name} ({cCount} طالب)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Classes & Students List */}
              {classes
                .filter((c) => rosterClassFilter === 'all' || c.id === rosterClassFilter)
                .map((cls) => {
                  let classStudents = students.filter((s) => s.classId === cls.id);
                  if (rosterSearch.trim()) {
                    const q = rosterSearch.trim().toLowerCase();
                    classStudents = classStudents.filter(
                      (s) =>
                        s.name.toLowerCase().includes(q) ||
                        s.personalNumber.toLowerCase().includes(q)
                    );
                  }

                  const totalInClass = students.filter((s) => s.classId === cls.id).length;

                  return (
                    <div key={cls.id} className="border-b border-stone-100 last:border-b-0 p-5">
                      {/* Class Header & Controls */}
                      <div className="flex items-center justify-between mb-3 bg-stone-50 p-3 rounded-2xl border border-stone-100">
                        {editingClassId === cls.id ? (
                          <div className="flex items-center gap-2 flex-1 max-w-sm">
                            <input
                              type="text"
                              value={editingClassName}
                              onChange={(e) => setEditingClassName(e.target.value)}
                              className="px-3 py-1.5 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-600 flex-1"
                              placeholder="اسم الصف الدراسي..."
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveClassEdit(cls.id)}
                              className="p-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs"
                              title="حفظ اسم الصف"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingClassId(null)}
                              className="p-1.5 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-xl text-xs"
                              title="إلغاء"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-emerald-950">{cls.name}</h4>
                            <span className="text-[11px] bg-emerald-100/80 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                              {totalInClass} طالب
                            </span>
                            <button
                              onClick={() => handleOpenEditClass(cls)}
                              className="text-stone-400 hover:text-emerald-700 p-1.5 rounded-lg hover:bg-white transition-colors"
                              title="تعديل اسم الصف"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        <div className="flex items-center gap-1">
                          {totalInClass > 0 && (
                            <button
                              onClick={() => handleClearClassStudents(cls.id, cls.name)}
                              className="text-stone-500 hover:text-amber-800 p-1.5 rounded-xl hover:bg-amber-50 text-xs flex items-center gap-1 transition-colors border border-transparent hover:border-amber-200"
                              title="حذف جميع طلاب هذا الصف"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">إفراغ الطلاب</span>
                            </button>
                          )}

                          {classes.length > 1 && (
                            <button
                              onClick={() => handleDeleteClassWithConfirm(cls)}
                              className="text-stone-500 hover:text-red-700 p-1.5 rounded-xl hover:bg-red-50 text-xs flex items-center gap-1 transition-colors border border-transparent hover:border-red-200"
                              title="حذف الصف الدراسي بالكامل"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">حذف الصف</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Students inside Class */}
                      {classStudents.length === 0 ? (
                        <p className="text-xs text-stone-400 italic py-3 text-center bg-stone-50/40 rounded-xl">
                          {rosterSearch
                            ? 'لا توجد نتائج مطابقة للبحث في هذا الصف.'
                            : 'لا يوجد طلاب مسجلون في هذا الصف بعد. يمكنك إضافة طلاب فردياً أو رفع كشف Excel بالأعلى.'}
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {classStudents.map((std) => (
                            <div
                              key={std.id}
                              className="flex items-center justify-between p-3 rounded-2xl border border-stone-200/80 hover:border-emerald-300 bg-white hover:shadow-xs transition-all"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                                  <GraduationCap className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <span className="text-xs font-bold text-stone-900 block truncate">
                                    {std.name}
                                  </span>
                                  <span className="text-[10px] text-stone-500 font-mono bg-stone-100 px-1.5 py-0.5 rounded inline-block mt-0.5">
                                    الرقم: {std.personalNumber}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0 mr-2">
                                <button
                                  onClick={() => handleOpenEditStudent(std)}
                                  className="text-stone-400 hover:text-emerald-700 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors"
                                  title="تعديل بيانات الطالب (الاسم، الرقم، الصف)"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteStudentWithConfirm(std)}
                                  className="text-stone-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                                  title="حذف الطالب نهائياً"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: ASSIGNMENTS MANAGEMENT */}
      {activeSection === 'assignments' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Create Assignment Form */}
          <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
              <span className="p-2 bg-emerald-50 text-emerald-800 rounded-xl">
                <BookOpen className="w-4 h-4" />
              </span>
              <div>
                <h3 className="font-bold text-sm text-stone-900">إسناد واجب تلاوة جديد</h3>
                <p className="text-[11px] text-stone-500">حدد الصف ونطاق الآيات المطلوب تلاوتها من سورة يس</p>
              </div>
            </div>

            {asgSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{asgSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">الصف أو الفرقة المستهدفة:</label>
                <select
                  value={asgClassId}
                  onChange={(e) => setAsgClassId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold"
                >
                  <option value="all">جميع الفرق (كافة الصفوف)</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
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
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    من الآية (سورة يس):
                  </label>
                  <select
                    value={asgStartAyah}
                    onChange={(e) => setAsgStartAyah(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono font-bold"
                  >
                    {SURAH_YASIN.map((ayah) => (
                      <option key={ayah.number} value={ayah.number}>
                        الآية {ayah.number} ({ayah.text.slice(0, 18)}...)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    إلى الآية (سورة يس):
                  </label>
                  <select
                    value={asgEndAyah}
                    onChange={(e) => setAsgEndAyah(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono font-bold"
                  >
                    {SURAH_YASIN.map((ayah) => (
                      <option key={ayah.number} value={ayah.number}>
                        الآية {ayah.number} ({ayah.text.slice(0, 18)}...)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  توجيهات وملاحظات المعلم للواجب:
                </label>
                <textarea
                  rows={2}
                  value={asgInstructions}
                  onChange={(e) => setAsgInstructions(e.target.value)}
                  placeholder="مثال: التركيز على أحكام الإدغام والمدود في الآيات..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                />
              </div>

              {/* Live Preview of Selected Verses */}
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl">
                <span className="text-[11px] font-bold text-amber-900 block mb-1.5">
                  معاينة الآيات المحددة ({asgStartAyah} إلى {asgEndAyah}) سورة يس:
                </span>
                <p className="font-quran text-base text-stone-800 leading-loose max-h-36 overflow-y-auto">
                  {previewAyahs.map((ayah) => (
                    <span key={ayah.number}>
                      {ayah.text}{' '}
                      <span className="text-xs font-mono font-bold text-amber-800 mx-1">
                        ﴿{ayah.number}﴾
                      </span>{' '}
                    </span>
                  ))}
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                {asgClassId === 'all' ? 'إسناد ونشر الواجب لجميع الفرق' : 'إسناد ونشر الواجب لطلاب الصف'}
              </button>
            </form>
          </div>

          {/* List of Existing Assignments */}
          <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-sm text-stone-900">
                الواجبات السابقة المسندة ({assignments.length})
              </h3>
              {assignments.length > 0 && (
                <button
                  type="button"
                  onClick={handleDeleteAllAssignments}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  title="حذف جميع الواجبات المسندة دفعة واحدة"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف جميع الواجبات</span>
                </button>
              )}
            </div>

            {assignments.length === 0 ? (
              <div className="text-center py-10 px-4 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                <BookOpen className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-stone-600 mb-1">لا توجد واجبات مسندة حالياً</p>
                <p className="text-[11px] text-stone-400">
                  يمكنك استخدام النموذج المجاور لإسناد واجب جديد لجميع الفرق أو لفرقة محددة
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map((asg) => {
                  const targetClass = classes.find((c) => c.id === asg.classId);
                  const asgSubmissions = submissions.filter((s) => s.assignmentId === asg.id);

                  return (
                    <div
                      key={asg.id}
                      className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 hover:bg-emerald-50/30 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-stone-900">{asg.title}</span>
                            {asg.classId === 'all' ? (
                              <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
                                جميع الفرق
                              </span>
                            ) : (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                                {targetClass?.name || 'صف'}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-stone-600 font-medium">
                            سورة يس: الآيات من ({asg.startAyah}) إلى ({asg.endAyah})
                          </p>
                          {asg.instructions && (
                            <p className="text-[11px] text-stone-500 mt-1 italic">{asg.instructions}</p>
                          )}
                          <span className="text-[10px] text-stone-400 block mt-2">
                            عدد الاستجابات: {asgSubmissions.length} طالب
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleOpenEditAssignment(asg)}
                            className="text-stone-400 hover:text-emerald-700 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors"
                            title="تعديل بيانات ونطاق الواجب"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAssignmentWithConfirm(asg)}
                            className="text-stone-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                            title="حذف الواجب"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-4">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-emerald-50 text-emerald-800 rounded-xl">
                  <Pencil className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-stone-900">تعديل بيانات الطالب</h3>
                  <p className="text-[11px] text-stone-500">تعديل اسم الطالب ورقمه الشخصي أو نقله لصف دراسي آخر</p>
                </div>
              </div>
              <button
                onClick={() => setEditingStudent(null)}
                className="text-stone-400 hover:text-stone-600 p-1.5 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudentEdit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">اسم الطالب الكامل:</label>
                <input
                  type="text"
                  required
                  value={editStudentName}
                  onChange={(e) => setEditStudentName(e.target.value)}
                  placeholder="الاسم الثلاثي للطالب"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">الرقم الشخصي:</label>
                <input
                  type="text"
                  required
                  value={editStudentPersonalNumber}
                  onChange={(e) => setEditStudentPersonalNumber(e.target.value)}
                  placeholder="الرقم الشخصي للطالب"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">الصف الدراسي / الفرقة:</label>
                <select
                  value={editStudentClassId}
                  onChange={(e) => setEditStudentClassId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Assignment Modal */}
      {editingAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-stone-200 my-8 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-4">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-emerald-50 text-emerald-800 rounded-xl">
                  <BookOpen className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-stone-900">تعديل واجب التلاوة</h3>
                  <p className="text-[11px] text-stone-500">تعديل عنوان الواجب والصف المستهدف ونطاق الآيات</p>
                </div>
              </div>
              <button
                onClick={() => setEditingAssignment(null)}
                className="text-stone-400 hover:text-stone-600 p-1.5 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAssignmentEdit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">الصف أو الفرقة المستهدفة:</label>
                <select
                  value={editAsgClassId}
                  onChange={(e) => setEditAsgClassId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                >
                  <option value="all">جميع الفرق (كافة الصفوف)</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">عنوان الواجب:</label>
                <input
                  type="text"
                  required
                  value={editAsgTitle}
                  onChange={(e) => setEditAsgTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">من الآية (سورة يس):</label>
                  <select
                    value={editAsgStartAyah}
                    onChange={(e) => setEditAsgStartAyah(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono font-bold"
                  >
                    {SURAH_YASIN.map((ayah) => (
                      <option key={ayah.number} value={ayah.number}>
                        الآية {ayah.number} ({ayah.text.slice(0, 16)}...)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">إلى الآية (سورة يس):</label>
                  <select
                    value={editAsgEndAyah}
                    onChange={(e) => setEditAsgEndAyah(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono font-bold"
                  >
                    {SURAH_YASIN.map((ayah) => (
                      <option key={ayah.number} value={ayah.number}>
                        الآية {ayah.number} ({ayah.text.slice(0, 16)}...)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">توجيهات المعلم:</label>
                <textarea
                  rows={2}
                  value={editAsgInstructions}
                  onChange={(e) => setEditAsgInstructions(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>

              {/* Live Preview of edited range */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl">
                <span className="text-[11px] font-bold text-amber-900 block mb-1">
                  معاينة الآيات من ({Math.min(editAsgStartAyah, editAsgEndAyah)}) إلى ({Math.max(editAsgStartAyah, editAsgEndAyah)}):
                </span>
                <p className="font-quran text-sm text-stone-800 leading-loose max-h-28 overflow-y-auto">
                  {SURAH_YASIN.filter(
                    (a) =>
                      a.number >= Math.min(editAsgStartAyah, editAsgEndAyah) &&
                      a.number <= Math.max(editAsgStartAyah, editAsgEndAyah)
                  ).map((ayah) => (
                    <span key={ayah.number}>
                      {ayah.text}{' '}
                      <span className="text-xs font-mono font-bold text-amber-800 mx-1">
                        ﴿{ayah.number}﴾
                      </span>{' '}
                    </span>
                  ))}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingAssignment(null)}
                  className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  حفظ تعديل الواجب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Submission Full AI Evaluation Modal */}
      {inspectSubmission && (
        <EvaluationModal
          isOpen={true}
          onClose={() => setInspectSubmission(null)}
          aiScore={inspectSubmission.aiScore}
          accuracyPercentage={inspectSubmission.accuracyPercentage}
          tajweedScore={inspectSubmission.tajweedScore}
          tajweedReport={inspectSubmission.tajweedReport}
          wordEvaluations={inspectSubmission.wordEvaluations}
          summaryFeedback={`تلاوة الطالب: ${inspectSubmission.studentName} • ${inspectSubmission.className}`}
          audioBase64={inspectSubmission.audioBase64}
        />
      )}
    </div>
  );
};
