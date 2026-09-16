import { Assignment, ClassRoom, Student, Submission } from '../types';
import {
  db,
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
} from '../lib/firebase';

const STORAGE_KEYS = {
  CLASSES: 'quran_recite_classes_v2',
  STUDENTS: 'quran_recite_students_v3',
  ASSIGNMENTS: 'quran_recite_assignments_v3',
  SUBMISSIONS: 'quran_recite_submissions_v2',
};

// Seed initial classes
export const INITIAL_CLASSES: ClassRoom[] = [
  { id: 'class-1', name: 'الفرقة ١', createdAt: '2026-09-01T10:00:00Z' },
  { id: 'class-2', name: 'الفرقة ٢', createdAt: '2026-09-01T10:00:00Z' },
  { id: 'class-3', name: 'الفرقة ٣', createdAt: '2026-09-01T10:00:00Z' },
  { id: 'class-4', name: 'الفرقة ٤', createdAt: '2026-09-01T10:00:00Z' },
  { id: 'class-5', name: 'الفرقة ٥', createdAt: '2026-09-01T10:00:00Z' },
];

// ----------------------------------------------------
// Local Storage synchronous getters
// ----------------------------------------------------
export function getClasses(): ClassRoom[] {
  const data = localStorage.getItem(STORAGE_KEYS.CLASSES);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(INITIAL_CLASSES));
    return INITIAL_CLASSES;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_CLASSES;
  }
}

export function getStudents(): Student[] {
  const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function getAssignments(): Assignment[] {
  const data = localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function getSubmissions(): Submission[] {
  const data = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// ----------------------------------------------------
// Realtime Firebase Cloud Synchronization
// ----------------------------------------------------
export function subscribeToCloudData(callbacks: {
  onClassesChange: (classes: ClassRoom[]) => void;
  onStudentsChange: (students: Student[]) => void;
  onAssignmentsChange: (assignments: Assignment[]) => void;
  onSubmissionsChange: (submissions: Submission[]) => void;
}) {
  const unsubClasses = onSnapshot(collection(db, 'classes'), (snapshot) => {
    if (!snapshot.empty) {
      const cloudClasses: ClassRoom[] = [];
      snapshot.forEach((d) => {
        cloudClasses.push({ id: d.id, ...(d.data() as Omit<ClassRoom, 'id'>) });
      });
      cloudClasses.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
      localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(cloudClasses));
      callbacks.onClassesChange(cloudClasses);
    } else {
      INITIAL_CLASSES.forEach(async (c) => {
        try {
          await setDoc(doc(db, 'classes', c.id), { name: c.name, createdAt: c.createdAt });
        } catch (e) {
          console.warn('Seed error', e);
        }
      });
      callbacks.onClassesChange(getClasses());
    }
  }, (err) => console.warn('Classes listener err:', err));

  const unsubStudents = onSnapshot(collection(db, 'students'), (snapshot) => {
    const cloudStudents: Student[] = [];
    snapshot.forEach((d) => {
      cloudStudents.push({ id: d.id, ...(d.data() as Omit<Student, 'id'>) });
    });
    cloudStudents.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(cloudStudents));
    callbacks.onStudentsChange(cloudStudents);
  }, (err) => console.warn('Students listener err:', err));

  const unsubAssignments = onSnapshot(collection(db, 'assignments'), (snapshot) => {
    const cloudAssignments: Assignment[] = [];
    snapshot.forEach((d) => {
      cloudAssignments.push({ id: d.id, ...(d.data() as Omit<Assignment, 'id'>) });
    });
    cloudAssignments.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(cloudAssignments));
    callbacks.onAssignmentsChange(cloudAssignments);
  }, (err) => console.warn('Assignments listener err:', err));

  const unsubSubmissions = onSnapshot(collection(db, 'submissions'), (snapshot) => {
    const cloudSubmissions: Submission[] = [];

    snapshot.forEach((d) => {
      const data = d.data() as Omit<Submission, 'id'>;
      cloudSubmissions.push({
        id: d.id,
        assignmentId: data.assignmentId || '',
        assignmentTitle: data.assignmentTitle || '',
        studentId: data.studentId || '',
        studentName: data.studentName || '',
        personalNumber: data.personalNumber || '',
        classId: data.classId || '',
        className: data.className || '',
        submittedAt: data.submittedAt || new Date().toISOString(),
        durationSeconds: data.durationSeconds || 0,
        transcribedText: data.transcribedText || '',
        accuracyPercentage: data.accuracyPercentage ?? 100,
        aiScore: data.aiScore ?? 10,
        tajweedScore: data.tajweedScore ?? 10,
        tajweedReport: data.tajweedReport || null,
        teacherGrade: data.teacherGrade !== undefined ? data.teacherGrade : null,
        teacherNotes: data.teacherNotes || '',
        wordEvaluations: data.wordEvaluations || [],
        audioBase64: '', 
      });
    });

    cloudSubmissions.sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''));
    
    // دمج ذكي مع التخزين المحلي لضمان عدم ضياع التسجيلات الفورية
    const existingLocal = getSubmissions();
    const mergedMap = new Map<string, Submission>();
    [...cloudSubmissions, ...existingLocal].forEach((sub) => {
      if (sub && sub.id) {
        // تفضيل السحابي إن وُجد، أو الاحتفاظ بالمحلي الحديث
        if (!mergedMap.has(sub.id) || sub.submittedAt > (mergedMap.get(sub.id)?.submittedAt || '')) {
          mergedMap.set(sub.id, sub);
        }
      }
    });
    
    const finalSubmissions = Array.from(mergedMap.values());
    finalSubmissions.sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''));

    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(finalSubmissions));
    callbacks.onSubmissionsChange(finalSubmissions);
  }, (err) => console.warn('Submissions listener err:', err));

  return () => {
    unsubClasses();
    unsubStudents();
    unsubAssignments();
    unsubSubmissions();
  };
}

// ----------------------------------------------------
// Mutators
// ----------------------------------------------------
export async function saveClass(name: string): Promise<ClassRoom> {
  const classes = getClasses();
  const id = `class-${Date.now()}`;
  const newClass: ClassRoom = { id, name: name.trim(), createdAt: new Date().toISOString() };
  classes.push(newClass);
  localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));

  try {
    await setDoc(doc(db, 'classes', id), { name: newClass.name, createdAt: newClass.createdAt });
  } catch (err) {
    console.warn('Cloud class save err', err);
  }
  return newClass;
}

export async function updateClass(classId: string, name: string): Promise<ClassRoom | null> {
  const classes = getClasses();
  const index = classes.findIndex((c) => c.id === classId);
  if (index === -1) return null;
  classes[index].name = name.trim();
  localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));

  try {
    await updateDoc(doc(db, 'classes', classId), { name: name.trim() });
  } catch (err) {
    console.warn('Cloud class update err', err);
  }
  return classes[index];
}

export async function deleteClass(classId: string): Promise<void> {
  const classes = getClasses().filter((c) => c.id !== classId);
  localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));

  try {
    await deleteDoc(doc(db, 'classes', classId));
  } catch (err) {
    console.warn('Cloud class delete err', err);
  }
}

export async function saveStudent(student: Omit<Student, 'id' | 'createdAt'>): Promise<Student> {
  const students = getStudents();
  const id = `std-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const newStudent: Student = { ...student, id, createdAt: new Date().toISOString() };
  students.push(newStudent);
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));

  try {
    await setDoc(doc(db, 'students', id), {
      name: newStudent.name,
      personalNumber: newStudent.personalNumber,
      classId: newStudent.classId,
      createdAt: newStudent.createdAt,
    });
  } catch (err) {
    console.warn('Cloud student save err', err);
  }
  return newStudent;
}

export async function updateStudent(
  studentId: string,
  updates: { name?: string; personalNumber?: string; classId?: string }
): Promise<Student | null> {
  const students = getStudents();
  const index = students.findIndex((s) => s.id === studentId);
  if (index === -1) return null;

  if (updates.name !== undefined) students[index].name = updates.name.trim();
  if (updates.personalNumber !== undefined) students[index].personalNumber = updates.personalNumber.trim();
  if (updates.classId !== undefined) students[index].classId = updates.classId;

  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));

  try {
    await updateDoc(doc(db, 'students', studentId), updates);
  } catch (err) {
    console.warn('Cloud student update err', err);
  }
  return students[index];
}

export async function saveBulkStudents(
  newStudents: Array<{ name: string; personalNumber: string; classId: string }>
): Promise<number> {
  const students = getStudents();
  let addedCount = 0;

  for (const item of newStudents) {
    if (!item.name || !item.personalNumber) continue;
    const exists = students.some(
      (s) => s.personalNumber.trim() === item.personalNumber.trim() && s.classId === item.classId
    );
    if (!exists) {
      const id = `std-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newStd: Student = {
        id,
        name: item.name.trim(),
        personalNumber: item.personalNumber.trim(),
        classId: item.classId,
        createdAt: new Date().toISOString(),
      };
      students.push(newStd);
      addedCount++;

      setDoc(doc(db, 'students', id), {
        name: newStd.name,
        personalNumber: newStd.personalNumber,
        classId: newStd.classId,
        createdAt: newStd.createdAt,
      }).catch((e) => console.warn('Bulk student cloud save err', e));
    }
  }

  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  return addedCount;
}

export async function deleteStudent(studentId: string): Promise<void> {
  const students = getStudents().filter((s) => s.id !== studentId);
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));

  try {
    await deleteDoc(doc(db, 'students', studentId));
  } catch (err) {
    console.warn('Cloud student delete err', err);
  }
}

export async function deleteStudentsInClass(classId: string): Promise<number> {
  const students = getStudents();
  const toDelete = students.filter((s) => s.classId === classId);
  const remaining = students.filter((s) => s.classId !== classId);
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(remaining));

  toDelete.forEach((std) => {
    deleteDoc(doc(db, 'students', std.id)).catch(() => {});
  });

  return toDelete.length;
}

export async function deleteAllStudents(): Promise<void> {
  const students = getStudents();
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify([]));
  students.forEach((std) => {
    deleteDoc(doc(db, 'students', std.id)).catch(() => {});
  });
}

export async function saveAssignment(assignment: Omit<Assignment, 'id' | 'createdAt'>): Promise<Assignment> {
  const assignments = getAssignments();
  const id = `asg-${Date.now()}`;
  const newAssignment: Assignment = {
    ...assignment,
    id,
    createdAt: new Date().toISOString(),
  };
  assignments.unshift(newAssignment);
  localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(assignments));

  try {
    await setDoc(doc(db, 'assignments', id), newAssignment);
  } catch (err) {
    console.warn('Cloud assignment save err', err);
  }

  return newAssignment;
}

export async function updateAssignment(
  assignmentId: string,
  updates: Partial<Omit<Assignment, 'id' | 'createdAt'>>
): Promise<Assignment | null> {
  const assignments = getAssignments();
  const index = assignments.findIndex((a) => a.id === assignmentId);
  if (index === -1) return null;

  assignments[index] = { ...assignments[index], ...updates };
  localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(assignments));

  try {
    await updateDoc(doc(db, 'assignments', assignmentId), updates);
  } catch (err) {
    console.warn('Cloud assignment update err', err);
  }

  return assignments[index];
}

export async function deleteAssignment(assignmentId: string): Promise<void> {
  const assignments = getAssignments().filter((a) => a.id !== assignmentId);
  localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(assignments));

  try {
    await deleteDoc(doc(db, 'assignments', assignmentId));
  } catch (err) {
    console.warn('Cloud assignment delete err', err);
  }
}

export async function deleteAllAssignments(): Promise<void> {
  const assignments = getAssignments();
  localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify([]));
  assignments.forEach((asg) => {
    deleteDoc(doc(db, 'assignments', asg.id)).catch(() => {});
  });
}

// دالة حفظ الاستجابة مع ضمان الإرسال السحابي الفوري من المحاولة الأولى
export async function saveSubmission(
  submission: Omit<Submission, 'id' | 'submittedAt'>
): Promise<Submission> {
  const submissions = getSubmissions();
  const id = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  const newSubmission: Submission = {
    ...submission,
    id,
    submittedAt: new Date().toISOString(),
    teacherGrade: submission.teacherGrade ?? null,
    teacherNotes: submission.teacherNotes || '',
    audioBase64: submission.audioBase64 || '', // حفظ الصوت محلياً لدهاز الطالب
  };

  submissions.unshift(newSubmission);
  localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));

  const cloudSubmission: Record<string, any> = {
    id: newSubmission.id,
    assignmentId: newSubmission.assignmentId,
    assignmentTitle: newSubmission.assignmentTitle || '',
    studentId: newSubmission.studentId,
    studentName: newSubmission.studentName || '',
    personalNumber: newSubmission.personalNumber || '',
    classId: newSubmission.classId || '',
    className: newSubmission.className || '',
    submittedAt: newSubmission.submittedAt,
    durationSeconds: newSubmission.durationSeconds || 0,
    transcribedText: newSubmission.transcribedText || '',
    accuracyPercentage: newSubmission.accuracyPercentage ?? 100,
    aiScore: newSubmission.aiScore ?? 10,
    tajweedScore: newSubmission.tajweedScore ?? 10,
    teacherGrade: newSubmission.teacherGrade,
    teacherNotes: newSubmission.teacherNotes,
    wordEvaluations: newSubmission.wordEvaluations || [],
  };

  if (newSubmission.tajweedReport) {
    cloudSubmission.tajweedReport = newSubmission.tajweedReport;
  }

  // الانتظار الإلزامي لرفع البيانات للسحابة لتصل المعلم من المحاولة الأولى فوراً
  try {
    await setDoc(doc(db, 'submissions', id), cloudSubmission);
  } catch (err) {
    console.warn('Cloud submission save err:', err);
  }

  return newSubmission;
}

export async function updateSubmissionTeacherFeedback(
  submissionId: string,
  teacherGrade: number | null,
  teacherNotes: string
): Promise<void> {
  const submissions = getSubmissions();
  const index = submissions.findIndex((s) => s.id === submissionId);
  if (index !== -1) {
    submissions[index].teacherGrade = teacherGrade;
    submissions[index].teacherNotes = teacherNotes;
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));

    try {
      await updateDoc(doc(db, 'submissions', submissionId), { teacherGrade, teacherNotes });
    } catch (err) {
      console.warn('Cloud submission feedback update err', err);
    }
  }
}

export async function deleteSubmission(submissionId: string): Promise<void> {
  const submissions = getSubmissions().filter((s) => s.id !== submissionId);
  localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));

  try {
    await deleteDoc(doc(db, 'submissions', submissionId));
  } catch (err) {
    console.warn('Cloud submission delete err', err);
  }
}
