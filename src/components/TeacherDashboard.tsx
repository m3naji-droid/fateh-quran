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
  deleteSubmission,
  getSubmissions
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

  // دمج قوي جداً بين البروبس والتخزين المحلي لضمان ظهور استجابات الطلاب للمعلم فوراً وبشكل لحظي
  const allTeacherSubmissions = React.useMemo(() => {
    const local = getSubmissions();
    const mergedMap = new Map<string, Submission>();
    [...(submissions || []), ...local].forEach((sub) => {
      if (sub && sub.id) {
        if (!mergedMap.has(sub.id) || sub.submittedAt > (mergedMap.get(sub.id)?.submittedAt || '')) {
          mergedMap.set(sub.id, sub);
        }
      }
    });
    const list = Array.from(mergedMap.values());
    list.sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''));
    return list;
  }, [submissions]);

  // Filtered submissions
  const filteredSubmissions = allTeacherSubmissions.filter((sub) => {
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

      const addedCount = await saveBulkStudents(rowsWithClass);
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
              <span className="text-lg font-black font-mono">{allTeacherSubmissions.length}</span>
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
          <span>جدول استجابات وتلاوات الطلاب ({allTeacherSubmissions.length})</span>
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

      {/* باقي الأقسام تبق كما هي للإدارة */}
      {activeSection === 'classes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-6">
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
          </div>
        </div>
      )}
    </div>
  );
};
